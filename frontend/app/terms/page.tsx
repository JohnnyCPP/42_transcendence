import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/layout/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Términos de servicio | TaskFlow',
  description: 'Condiciones de uso de la aplicación TaskFlow.',
};

/**
 * Términos de servicio de TaskFlow.
 *
 * Contenido orientado al subject de ft_transcendence (página real, no vacía).
 */
export default function TermsPage() {
  return (
    <LegalDocumentLayout
      title="Términos de servicio"
      subtitle="Condiciones bajo las que puedes usar TaskFlow como aplicación académica."
      lastUpdated="26 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">1. Aceptación</h2>
        <p className="text-on-surface-variant">
          Al crear una cuenta o usar TaskFlow aceptas estos términos. Si no estás
          de acuerdo, no utilices la aplicación. TaskFlow forma parte de un
          proyecto educativo (42 — ft_transcendence).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">2. Descripción del servicio</h2>
        <p className="text-on-surface-variant">
          TaskFlow ofrece un espacio web para gestionar organizaciones, tableros
          tipo Kanban, listas y tareas, con autenticación de usuarios. Algunas
          funciones pueden estar en desarrollo o usar datos de demostración.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">3. Cuentas</h2>
        <ul className="list-disc space-y-2 pl-5 text-on-surface-variant">
          <li>Debes proporcionar un nombre de usuario y una contraseña seguros.</li>
          <li>Eres responsable de la confidencialidad de tus credenciales.</li>
          <li>
            No debes intentar acceder a cuentas ajenas ni abusar de la API o de
            la sesión.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">4. Uso aceptable</h2>
        <p className="text-on-surface-variant">
          Te comprometes a no usar TaskFlow para actividades ilegales, spam,
          acoso, ni para comprometer la seguridad del servidor o de otros
          usuarios. El contenido que publiques en tableros debe respetar la ley
          aplicable y los derechos de terceros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">5. Contenido del usuario</h2>
        <p className="text-on-surface-variant">
          Conservas la titularidad de tu contenido. Nos concedes una licencia
          limitada para almacenarlo y mostrarlo dentro de TaskFlow con el fin de
          prestar el servicio. Puedes solicitar la eliminación de tu cuenta y
          datos asociados según la política de privacidad.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">6. Disponibilidad</h2>
        <p className="text-on-surface-variant">
          El servicio se ofrece “tal cual” en un entorno académico. Puede haber
          interrupciones, pérdida de datos de prueba o cambios de funcionalidad
          sin aviso previo. No garantizamos disponibilidad continua ni idoneidad
          para uso comercial crítico.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">7. Limitación de responsabilidad</h2>
        <p className="text-on-surface-variant">
          En la medida permitida por la ley, el equipo de TaskFlow no será
          responsable de daños indirectos, pérdida de datos o interrupciones
          derivados del uso de la aplicación en el marco del proyecto 42.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">8. Cambios</h2>
        <p className="text-on-surface-variant">
          Podemos actualizar estos términos. La fecha de “última actualización”
          reflejará el cambio. El uso continuado tras una modificación implica
          la aceptación de la nueva versión.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">9. Contacto</h2>
        <p className="text-on-surface-variant">
          Para consultas sobre estos términos, contacta al equipo del proyecto
          a través de los canales indicados en el README del repositorio.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
