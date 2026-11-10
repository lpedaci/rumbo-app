# Logos de proveedores de identidad

Únicos elementos de marcas de terceros del proyecto (CLAUDE.md 2.1 y F0). Se usan **solo** en los botones "Continuar con Microsoft" y "Continuar con Google" del login (G1) y **sin modificar**: ni color, ni proporción, ni tamaño relativo, ni combinados con el logo de Rumbo.

| Archivo | Origen | Descargado | Notas |
| --- | --- | --- | --- |
| `microsoft-logo.svg` | Microsoft Learn, *Sign in with Microsoft branding guidelines*: https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps (archivo `ms-symbollockup_mssymbol_19.svg`) | 10/11/2026 | Logo de cuatro cuadrados. La guía pide no alterarlo y usar "work or school account" (en la interfaz: "cuenta de trabajo"). |
| `google-g-logo.png` | Google Identity, *Sign in with Google branding guidelines*: https://developers.google.com/identity/branding-guidelines (archivo `g-logo.png`) | 10/11/2026 | "G" estándar a todo color, sobre fondo blanco. Se usa el PNG oficial porque el SVG del paquete `signin-assets.zip` dibuja la "G" con un degradé dentro de un `foreignObject`, que no se ve bien como imagen y choca con la CSP (D-42). |

Reglas aplicadas en `SsoButton.tsx`:
- Textos exactos: "Continuar con Microsoft" y "Continuar con Google" (Google recomienda "Continue with Google" y permite localizarlo).
- Los dos botones tienen el mismo tamaño, estilo y peso visual (Google pide igual prominencia).
- Fondo blanco con borde, como el tema claro de ambas guías. El logo es decorativo (`alt=""`): el texto del botón ya nombra al proveedor.
