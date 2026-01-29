"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
          
          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-gray-600 text-sm">
              Última actualización: Enero 2026
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed">
                En BAUSING nos comprometemos a proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos su información personal cuando visita nuestro sitio web o realiza compras en nuestra tienda online.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Al utilizar nuestro sitio web, usted acepta las prácticas descritas en esta política. Le recomendamos leer este documento detenidamente y contactarnos si tiene alguna pregunta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Información que Recopilamos</h2>
              <p className="text-gray-700 leading-relaxed">
                Recopilamos diferentes tipos de información para brindarle un mejor servicio:
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Información que usted nos proporciona:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Datos de registro:</strong> nombre completo, dirección de correo electrónico, contraseña, número de teléfono</li>
                <li><strong>Datos de envío:</strong> dirección postal, código postal, ciudad, provincia</li>
                <li><strong>Datos de facturación:</strong> CUIT/CUIL, razón social (para facturas tipo A)</li>
                <li><strong>Datos de pago:</strong> información de tarjeta de crédito/débito (procesada de forma segura por nuestros proveedores de pago)</li>
                <li><strong>Comunicaciones:</strong> mensajes que nos envía a través del formulario de contacto o correo electrónico</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Información recopilada automáticamente:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Datos de navegación:</strong> páginas visitadas, tiempo de permanencia, productos vistos</li>
                <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, tipo de dispositivo</li>
                <li><strong>Cookies y tecnologías similares:</strong> información almacenada en su dispositivo para mejorar su experiencia</li>
                <li><strong>Datos de ubicación:</strong> ubicación aproximada basada en su dirección IP</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Uso de la Información</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos su información personal para los siguientes fines:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Procesar pedidos:</strong> gestionar sus compras, envíos y devoluciones</li>
                <li><strong>Comunicación:</strong> enviar confirmaciones de pedido, actualizaciones de envío y responder a sus consultas</li>
                <li><strong>Personalización:</strong> mostrar productos y ofertas relevantes basadas en sus preferencias</li>
                <li><strong>Marketing:</strong> enviar boletines informativos, promociones y ofertas especiales (solo si ha dado su consentimiento)</li>
                <li><strong>Mejora del servicio:</strong> analizar el uso del sitio para mejorar nuestra plataforma y experiencia de usuario</li>
                <li><strong>Seguridad:</strong> prevenir fraudes y proteger nuestro sitio web</li>
                <li><strong>Cumplimiento legal:</strong> cumplir con obligaciones legales y requerimientos de autoridades</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Compartir Información</h2>
              <p className="text-gray-700 leading-relaxed">
                No vendemos su información personal. Sin embargo, podemos compartir sus datos con:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Proveedores de servicios:</strong> empresas que nos ayudan a operar (procesadores de pago, servicios de envío, hosting, email marketing)</li>
                <li><strong>Socios logísticos:</strong> transportistas y servicios de mensajería para realizar las entregas</li>
                <li><strong>Autoridades legales:</strong> cuando sea requerido por ley o para proteger nuestros derechos</li>
                <li><strong>Empresas del grupo:</strong> otras empresas de nuestro grupo corporativo con fines administrativos internos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Todos nuestros proveedores están obligados a proteger su información y utilizarla únicamente para los fines especificados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cookies y Tecnologías de Rastreo</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Cookies esenciales:</strong> necesarias para el funcionamiento del sitio (carrito de compras, sesión de usuario)</li>
                <li><strong>Cookies de rendimiento:</strong> nos ayudan a entender cómo los usuarios interactúan con el sitio</li>
                <li><strong>Cookies de funcionalidad:</strong> recuerdan sus preferencias (idioma, ubicación)</li>
                <li><strong>Cookies de marketing:</strong> permiten mostrar anuncios relevantes (requieren su consentimiento)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Puede configurar su navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio. También puede gestionar sus preferencias de cookies desde el banner que aparece al visitar nuestro sitio por primera vez.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Seguridad de los Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li>Encriptación SSL/TLS para todas las transmisiones de datos</li>
                <li>Almacenamiento seguro de contraseñas mediante algoritmos de hash</li>
                <li>Acceso restringido a datos personales solo a personal autorizado</li>
                <li>Monitoreo continuo de seguridad y detección de intrusiones</li>
                <li>Copias de seguridad regulares</li>
                <li>Cumplimiento con estándares PCI DSS para procesamiento de pagos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Sin embargo, ningún método de transmisión por Internet es 100% seguro. Aunque nos esforzamos por proteger su información, no podemos garantizar su seguridad absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Retención de Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Conservamos su información personal durante el tiempo necesario para cumplir con los fines para los que fue recopilada:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Datos de cuenta:</strong> mientras mantenga una cuenta activa con nosotros</li>
                <li><strong>Datos de transacciones:</strong> 10 años para cumplir con obligaciones fiscales y legales</li>
                <li><strong>Datos de marketing:</strong> hasta que retire su consentimiento</li>
                <li><strong>Datos de navegación:</strong> máximo 2 años</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Una vez cumplido el período de retención, sus datos serán eliminados o anonimizados de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Sus Derechos</h2>
              <p className="text-gray-700 leading-relaxed">
                De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, usted tiene los siguientes derechos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Derecho de acceso:</strong> solicitar información sobre los datos personales que tenemos sobre usted</li>
                <li><strong>Derecho de rectificación:</strong> corregir datos inexactos o incompletos</li>
                <li><strong>Derecho de supresión:</strong> solicitar la eliminación de sus datos personales</li>
                <li><strong>Derecho de oposición:</strong> oponerse al tratamiento de sus datos para determinados fines</li>
                <li><strong>Derecho a retirar el consentimiento:</strong> revocar el consentimiento otorgado para el tratamiento de sus datos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Para ejercer estos derechos, puede contactarnos a través de los medios indicados al final de esta política. Responderemos a su solicitud dentro de los plazos legales establecidos.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Menores de Edad</h2>
              <p className="text-gray-700 leading-relaxed">
                Nuestro sitio web no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal de menores. Si descubrimos que hemos recopilado información de un menor sin el consentimiento verificable de sus padres, eliminaremos esa información lo antes posible.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Si usted es padre o tutor y cree que su hijo nos ha proporcionado información personal, contáctenos inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Enlaces a Terceros</h2>
              <p className="text-gray-700 leading-relaxed">
                Nuestro sitio web puede contener enlaces a otros sitios web que no están operados por nosotros. Si hace clic en un enlace de terceros, será dirigido al sitio de ese tercero. Le recomendamos revisar la Política de Privacidad de cada sitio que visite.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                No tenemos control sobre, y no asumimos responsabilidad por, el contenido, políticas de privacidad o prácticas de sitios o servicios de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Cambios en esta Política</h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos actualizar nuestra Política de Privacidad periódicamente. Le notificaremos cualquier cambio publicando la nueva política en esta página y actualizando la fecha de &quot;última actualización&quot;.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Para cambios significativos, le enviaremos una notificación por correo electrónico o mostraremos un aviso destacado en nuestro sitio web antes de que el cambio entre en vigor.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Le recomendamos revisar esta Política de Privacidad periódicamente para estar informado sobre cómo protegemos su información.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, puede contactarnos:
              </p>
              <ul className="list-none text-gray-700 space-y-2 mt-3">
                <li><strong>Responsable de Protección de Datos:</strong> BAUSING S.R.L.</li>
                <li><strong>Email:</strong> privacidad@bausing.com</li>
                <li><strong>Email general:</strong> hola@bausing.com</li>
                <li><strong>Teléfono:</strong> +54 9 11 4049-0344</li>
                <li><strong>Dirección:</strong> Av. Corrientes 1234, Córdoba, Argentina</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Nos comprometemos a responder a sus consultas y solicitudes en el menor tiempo posible.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
