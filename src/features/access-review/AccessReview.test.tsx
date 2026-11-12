import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import {
  buildReviewItems,
  campaignProgress,
  closeBlock,
  itemState,
  progressByReviewer,
  reviewerFor,
  revokeBlock,
} from '@/lib/access-review';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  act(() => {
    switchRole('manager');
  });
});

const campaign = () => useDataStore.getState().accessReviews.find((c) => c.id === 'AR-2026-0001')!;
const person = (id: string) => useDataStore.getState().people.find((p) => p.id === id)!;

describe('F13 · Access review rules', () => {
  it('assigns the manager, HR when there is none, and IT for HR itself; never oneself', () => {
    const { people } = useDataStore.getState();
    expect(reviewerFor(person('p-sofia'), people)).toEqual({ reviewerId: 'p-martin', via: 'manager' });
    expect(reviewerFor(person('p-ramiro'), people)).toEqual({ reviewerId: 'p-carla', via: 'hr' });
    // D-120: Carla is reviewed by her manager, Valeria; Valeria, without a manager, by HR (Carla).
    expect(reviewerFor(person('p-carla'), people)).toEqual({ reviewerId: 'p-valeria', via: 'manager' });
    expect(reviewerFor(person('p-valeria'), people)).toEqual({ reviewerId: 'p-carla', via: 'hr' });
    expect(campaign().items.every((i) => i.reviewerId !== i.personId)).toBe(true);
  });

  it('always includes the admin accounts, with their role as a row, even in an area campaign', () => {
    const { people, jobTitles } = useDataStore.getState();
    const items = buildReviewItems('AR-X', people, jobTitles, { areaId: 'a-comercial' });
    const ids = new Set(items.map((i) => i.personId));
    expect(ids.has('p-camila')).toBe(true);
    expect(ids.has('p-sofia')).toBe(false);
    for (const admin of ['p-carla', 'p-diego', 'p-ramiro']) expect(ids.has(admin)).toBe(true);
    expect(items.filter((i) => i.kind === 'role').map((i) => i.personId).sort()).toEqual(['p-carla', 'p-diego', 'p-ramiro']);
  });

  it('starts the seed campaign half reviewed, with Martín among the reviewers', () => {
    const { done, total } = campaignProgress(campaign().items);
    expect(done).toBeGreaterThan(0);
    expect(done).toBeLessThan(total);
    const martin = progressByReviewer(campaign().items).find((r) => r.reviewerId === 'p-martin')!;
    expect(martin.people).toHaveLength(9);
    expect(closeBlock(campaign(), [])).toBe('undecided');
  });

  it('keeps the role of the demo accounts', () => {
    const carlaRole = campaign().items.find((i) => i.personId === 'p-carla' && i.kind === 'role')!;
    const ramiroRole = campaign().items.find((i) => i.personId === 'p-ramiro' && i.kind === 'role')!;
    expect(revokeBlock(carlaRole)).toBe('demo_role');
    expect(revokeBlock(ramiroRole)).toBeUndefined();
  });
});

describe('F13 · Store', () => {
  it('lets a reviewer decide only their own rows', () => {
    const sofia = campaign().items.filter((i) => i.personId === 'p-tomas').map((i) => i.id);
    expect(useDataStore.getState().decideReviewItems('AR-2026-0001', sofia, 'keep', '', 'p-carla')).toBe(0);
    expect(useDataStore.getState().decideReviewItems('AR-2026-0001', sofia, 'keep', '', 'p-martin')).toBe(sofia.length);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'access_review.keep', actorId: 'p-martin' });
  });

  it('revokes a system for IT to execute, audited with the campaign name', () => {
    const row = campaign().items.find((i) => i.personId === 'p-tomas' && i.access === 'Figma')!;
    useDataStore.getState().decideReviewItems('AR-2026-0001', [row.id], 'revoke', 'Ya no diseña pantallas.', 'p-martin');
    expect(itemState(campaign().items.find((i) => i.id === row.id)!, [])).toBe('revoke_pending');
    useDataStore.getState().executeReviewRevocation('AR-2026-0001', row.id, 'p-diego');
    expect(itemState(campaign().items.find((i) => i.id === row.id)!, [])).toBe('revoked');
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({
      action: 'access.revoke',
      detail: 'Figma · Revisión trimestral Q4 2026',
    });
  });

  it('blocks the revocation of Ramiro: IT would keep only one person (D-121)', () => {
    const row = campaign().items.find((i) => i.personId === 'p-ramiro' && i.kind === 'role')!;
    const approvals = useDataStore.getState().approvals.length;
    useDataStore.getState().decideReviewItems('AR-2026-0001', [row.id], 'revoke', 'Ya no administra Rumbo.', 'p-carla');
    const decided = campaign().items.find((i) => i.id === row.id)!;
    expect(itemState(decided, useDataStore.getState().approvals)).toBe('revoke_blocked');
    expect(decided.approvalId).toBeUndefined();
    expect(useDataStore.getState().approvals).toHaveLength(approvals);
    expect(person('p-ramiro').role).toBe('it_admin');
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({
      action: 'access_review.revoke',
      result: 'denied',
      actorId: 'p-carla',
    });
    expect(useDataStore.getState().auditEvents.at(-1)!.detail).toContain('Revisión trimestral Q4 2026');
    // A blocked row counts as decided: it does not hold the campaign open.
    expect(closeBlock(campaign(), useDataStore.getState().approvals)).toBe('undecided');
  });

  it('sends the revocation to double approval when IT keeps two people', () => {
    // A third person in IT first (requested by Carla, approved by Diego).
    const id = useDataStore.getState().changeRole('p-julieta', 'it_admin', 'Se suma a la mesa de ayuda.', 'p-carla')!;
    useDataStore.getState().decideApproval(id, 'approved', '', 'p-diego');
    const row = campaign().items.find((i) => i.personId === 'p-ramiro' && i.kind === 'role')!;
    useDataStore.getState().decideReviewItems('AR-2026-0001', [row.id], 'revoke', 'Ya no administra Rumbo.', 'p-carla');
    const decided = campaign().items.find((i) => i.id === row.id)!;
    expect(itemState(decided, useDataStore.getState().approvals)).toBe('revoke_in_approval');
    useDataStore.getState().decideApproval(decided.approvalId!, 'approved', '', 'p-diego');
    expect(itemState(decided, useDataStore.getState().approvals)).toBe('revoked');
    expect(person('p-ramiro').role).toBe('hire');
  });

  it('lets IT resolve Valeria’s review as a demo shortcut, recorded in her name (D-120)', () => {
    const rows = campaign().items.filter((i) => i.reviewerId === 'p-valeria').map((i) => i.id);
    expect(campaign().items.filter((i) => i.reviewerId === 'p-valeria').every((i) => i.personId === 'p-carla' && !i.decision)).toBe(true);
    expect(useDataStore.getState().decideReviewItems('AR-2026-0001', rows, 'keep', '', 'p-valeria', true)).toBe(rows.length);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ actorId: 'p-valeria', action: 'access_review.keep' });
    expect(useDataStore.getState().auditEvents.at(-1)!.detail).toContain('decisión simulada en la demo');
  });

  it('creates a campaign, tells each reviewer and closes it only when everything is done', () => {
    const id = useDataStore.getState().createReviewCampaign(
      { name: 'Revisión de Comercial', dueDate: '2026-11-30', scope: { areaId: 'a-comercial' } },
      'p-diego',
    );
    expect(id).toBe('AR-2026-0002');
    const created = useDataStore.getState().accessReviews.find((c) => c.id === id)!;
    const reviewers = new Set(created.items.map((i) => i.reviewerId));
    const told = useDataStore.getState().notifications.filter((n) => n.type === 'access_review.assigned' && n.params.campaign === created.name);
    expect(new Set(told.map((n) => n.recipientId))).toEqual(reviewers);
    expect(useDataStore.getState().closeReviewCampaign(id, 'p-diego')).toBe(false);
    for (const reviewer of reviewers) {
      const rows = created.items.filter((i) => i.reviewerId === reviewer).map((i) => i.id);
      useDataStore.getState().decideReviewItems(id, rows, 'keep', '', reviewer);
    }
    expect(useDataStore.getState().closeReviewCampaign(id, 'p-diego')).toBe(true);
    expect(useDataStore.getState().accessReviews.find((c) => c.id === id)!.status).toBe('closed');
  });
});

describe('J4, S5 and S6 · Review screens', () => {
  it('lets Martín keep the pending access of a person in one click', async () => {
    renderAt('/manager/access-review');
    expect(await screen.findByRole('heading', { level: 1, name: es.accessReview.title })).toBeInTheDocument();
    const tomas = screen.getByRole('region', { name: 'Tomás Herrera' });
    fireEvent.click(within(tomas).getByRole('button', { name: /Mantener los \d+ pendientes/ }));
    await waitFor(() =>
      expect(campaign().items.filter((i) => i.personId === 'p-tomas').every((i) => i.decision === 'keep')).toBe(true),
    );
  });

  it('asks for a reason before revoking', async () => {
    renderAt('/manager/access-review');
    fireEvent.click(await screen.findByRole('button', { name: 'Revocar Figma de Tomás Herrera' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.accessReview.revokeDialog.confirm }));
    expect(await within(dialog).findByText(es.accessReview.revokeDialog.reasonRequired)).toBeInTheDocument();
  });

  it('shows the campaign to IT with the reviewers and the reason HR reviews someone', async () => {
    act(() => {
      switchRole('it_admin');
    });
    renderAt('/it/access-reviews/AR-2026-0001');
    expect(await screen.findByRole('heading', { level: 1, name: 'Revisión trimestral Q4 2026' })).toBeInTheDocument();
    expect(screen.getByText(/Revisa por falta de jefe directo: .*Martín Rossi/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.accessReview.detail.close })).toBeDisabled();
  });
});
