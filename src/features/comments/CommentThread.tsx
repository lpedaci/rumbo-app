import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { FormFooter } from '@/components/ui/FormFooter';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { detectMentions, participantsOf, segmentsOf, threadOf } from '@/lib/comments';
import { formatDateTime } from '@/lib/dates';
import { can, canViewHire } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { COMMENT_MAX, commentSchema, issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Comment, Hire, HireTask, Person } from '@/types/domain';

/**
 * Comments of a journey task (F9): the conversation, oldest first, and a box to write. Mentions
 * are inserted with the "Mencionar a" chips (or typed as @Nombre) and notify that person. The
 * author can edit (marked "editado") or delete (a "Comentario eliminado" mark stays) their own.
 * Plain text only: it is shown as typed, never as HTML (8.2).
 */
export function CommentThread({ hire, task, headingId }: { hire: Hire; task: HireTask; headingId?: string }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const all = useDataStore((s) => s.comments);
  const thread = threadOf(all, task.id);
  const participants = participantsOf(hire, people);
  const canWrite = can(user, 'comment:write') && canViewHire(user, hire);
  const [body, setBody] = useState('');
  const [tried, setTried] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Comment | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const issue = issuesByPath(commentSchema.safeParse(body))[''];
  const error = tried && issue ? t(issue) : undefined;
  const others = participants.filter((p) => p.id !== user?.personId);

  const insertMention = (person: Person) => {
    const sep = body && !/\s$/.test(body) ? ' ' : '';
    setBody(`${body}${sep}@${person.name} `);
    boxRef.current?.focus();
  };

  const send = () => {
    setTried(true);
    if (issue || !user) {
      boxRef.current?.focus();
      return;
    }
    useDataStore.getState().addComment({
      hireId: hire.id,
      hireTaskId: task.id,
      authorId: user.personId,
      body,
      mentions: detectMentions(body, participants).filter((id) => id !== user.personId),
    });
    setBody('');
    setTried(false);
    toast.success(t('comments.sent'));
  };

  return (
    <div className="flex flex-col gap-4">
      {thread.length === 0 ? (
        <p className="text-body-medium text-on-surface-variant">{t('comments.empty')}</p>
      ) : (
        // Divider list like the other lists (D-106)
        <ol aria-labelledby={headingId} className="-mx-2 flex flex-col">
          {thread.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              author={people.find((p) => p.id === c.authorId)}
              participants={participants}
              own={c.authorId === user?.personId}
              editing={editing === c.id}
              onEdit={() => setEditing(c.id)}
              onCancelEdit={() => setEditing(null)}
              onDelete={() => setToDelete(c)}
            />
          ))}
        </ol>
      )}

      {canWrite ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex flex-col gap-3"
        >
          <TextArea
            ref={boxRef}
            id={`comment-${task.id}`}
            label={t('comments.label')}
            helperText={t('comments.help')}
            error={error}
            value={body}
            rows={3}
            maxLength={COMMENT_MAX + 100}
            onChange={(event) => setBody(event.target.value)}
          />
          {others.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-label-large text-on-surface-variant">{t('comments.mention')}</span>
              {others.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={t('comments.mentionChip', { name: p.name })}
                  onClick={() => insertMention(p)}
                  className="inline-flex h-8 items-center gap-1 rounded-sm border border-outline px-3 text-label-large text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:min-h-12"
                >
                  <Icon name="alternate_email" size={16} className="text-primary" />
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <FormFooter>
            <Button type="submit" leadingIcon="send">
              {t('comments.send')}
            </Button>
          </FormFooter>
        </form>
      ) : (
        <p className="text-body-small text-on-surface-variant">{t('comments.readOnly')}</p>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t('comments.deleteTitle')}
        description={t('comments.deleteBody')}
        confirmLabel={t('comments.deleteConfirm')}
        destructive
        onConfirm={() => {
          if (!toDelete || !user) return;
          useDataStore.getState().deleteComment(toDelete.id, user.personId);
          toast.success(t('comments.deletedToast'));
        }}
      />
    </div>
  );
}

function CommentItem({
  comment: c,
  author,
  participants,
  own,
  editing,
  onEdit,
  onCancelEdit,
  onDelete,
}: {
  comment: Comment;
  author?: Person;
  participants: Person[];
  own: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(c.body);
  const [tried, setTried] = useState(false);
  const issue = issuesByPath(commentSchema.safeParse(draft))[''];
  const mentioned = participants.filter((p) => c.mentions.includes(p.id));
  const name = author?.name ?? '';

  const save = () => {
    setTried(true);
    if (issue) return;
    useDataStore
      .getState()
      .editComment(c.id, draft, detectMentions(draft, participants).filter((id) => id !== c.authorId), c.authorId);
    onCancelEdit();
    toast.success(t('comments.updated'));
  };

  return (
    <li className="flex min-w-0 items-start gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0">
      {author ? <Avatar name={author.name} role={author.role} size="sm" /> : <span className="size-8 shrink-0" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-title-small text-on-surface">{own ? `${name} (${t('comments.you')})` : name}</span>
          <time dateTime={c.createdAt} className="text-body-small text-on-surface-variant tabular-nums">
            {formatDateTime(c.createdAt)}
          </time>
          {c.editedAt && !c.deletedAt && (
            <span className="text-body-small text-on-surface-variant">· {t('comments.edited')}</span>
          )}
        </p>
        {c.deletedAt ? (
          <p className="flex items-center gap-1.5 text-body-medium text-on-surface-variant">
            <Icon name="delete" size={16} />
            {t('comments.deleted')}
          </p>
        ) : editing ? (
          <div className="flex flex-col gap-3">
            <TextArea
              id={`edit-${c.id}`}
              label={t('comments.label')}
              helperText={t('comments.help')}
              error={tried && issue ? t(issue) : undefined}
              value={draft}
              rows={3}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="text" size="xs" onClick={onCancelEdit}>
                {t('comments.cancel')}
              </Button>
              <Button variant="tonal" size="xs" leadingIcon="check" onClick={save}>
                {t('comments.save')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-body-medium whitespace-pre-wrap text-on-surface [overflow-wrap:anywhere]">
            {segmentsOf(c.body, mentioned).map((s, i) => (
              <span key={i} className={cn(s.mention && 'text-label-large text-primary')}>
                {s.text}
              </span>
            ))}
          </p>
        )}
      </div>
      {own && !c.deletedAt && !editing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton icon="more_vert" size="xs" label={t('comments.actions', { name })} />
          </DropdownMenuTrigger>
          <DropdownMenuContent label={t('comments.actions', { name })}>
            <DropdownMenuItem icon="edit" onSelect={onEdit}>
              {t('comments.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem icon="delete" destructive onSelect={onDelete}>
              {t('comments.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
