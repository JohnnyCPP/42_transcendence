import type { Metadata } from 'next';
import LegalDocumentLayout from '@/components/layout/LegalDocumentLayout';

export const metadata: Metadata = {
  title: 'Política de privacidad | TaskFlow',
  description: 'Cómo TaskFlow trata los datos personales de sus usuarios.',
};

/**
 * Política de privacidad de TaskFlow.
 *
 * Contenido orientado al subject de ft_transcendence (página real, no vacía).
 */
export default function PrivacyPage() {
  return (
    <LegalDocumentLayout
      title="Política de privacidad"
      subtitle="Explica qué datos recoge TaskFlow, con qué fin y cómo puedes ejercer tus derechos."
      lastUpdated="26 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">1. Quiénes somos</h2>
        <p className="text-on-surface-variant">
          TaskFlow es una aplicación web de gestión de tableros y tareas desarrollada
          como proyecto académico en el marco del currículo de 42 (ft_transcendence).
          Esta política describe el tratamiento de datos en el entorno de la aplicación.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">2. Datos que tratamos</h2>
        <ul className="list-disc space-y-2 pl-5 text-on-surface-variant">
          <li>
            <strong className="text-on-surface">Cuenta:</strong> nombre de usuario,
            contraseña (almacenada de forma cifrada/hasheada en el servidor) y,
            si lo facilitas, correo electrónico.
          </li>
          <li>
            <strong className="text-on-surface">Sesión:</strong> cookie HttpOnly de
            sesión para mantenerte autenticado de forma segura.
          </li>
          <li>
            <strong className="text-on-surface">Contenido de trabajo:</strong>{' '}
            organizaciones, tableros, listas y tareas que crees dentro de la app
            (cuando esos módulos estén activos).
          </li>
          <li>
            <strong className="text-on-surface">Datos técnicos:</strong> registros
            básicos de petición (p. ej. dirección IP o user-agent) que el servidor
            puede usar para seguridad y diagnóstico.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">3. Finalidad</h2>
        <p className="text-on-surface-variant">
          Usamos estos datos para autenticarte, prestar el servicio de TaskFlow,
          proteger la cuenta (incluyendo mecanismos como 2FA si están habilitados)
          y mejorar la estabilidad de la plataforma en un contexto educativo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">4. Base y conservación</h2>
        <p className="text-on-surface-variant">
          El tratamiento se basa en la necesidad de ejecutar la cuenta que has creado
          y en el interés legítimo de asegurar el servicio. Conservamos los datos
          mientras tu cuenta exista o mientras el entorno académico del proyecto
          esté operativo. Puedes solicitar el borrado de tu cuenta al equipo del
          proyecto.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">5. Cookies</h2>
        <p className="text-on-surface-variant">
          TaskFlow utiliza una cookie de sesión HttpOnly imprescindible para el
          inicio de sesión. No empleamos cookies publicitarias de terceros. El
          navegador puede eliminar cookies desde su configuración; al hacerlo
          deberás volver a iniciar sesión.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">6. Cesiones y encargados</h2>
        <p className="text-on-surface-variant">
          No vendemos datos personales. El procesamiento ocurre en la infraestructura
          del proyecto (frontend, backend y base de datos del equipo). Si en el
          futuro se integran proveedores externos (p. ej. OAuth), se documentará
          aquí.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">7. Tus derechos</h2>
        <p className="text-on-surface-variant">
          Puedes solicitar acceso, rectificación o eliminación de tus datos de
          cuenta contactando al equipo de TaskFlow a través de los canales del
          proyecto 42. Responderemos en la medida de lo posible dentro del ámbito
          académico de la aplicación.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-on-surface">8. Contacto</h2>
        <p className="text-on-surface-variant">
          Para dudas sobre privacidad, contacta a los miembros del equipo indicados
          en el README del repositorio del proyecto.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
