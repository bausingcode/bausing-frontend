"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>
          
          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-gray-600 text-sm">
              Última actualización: Enero 2026
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed">
                Bienvenido a BAUSING. Estos Términos y Condiciones regulan el uso de nuestro sitio web y la compra de productos a través de nuestra plataforma de comercio electrónico. Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones, así como a nuestra Política de Privacidad.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                BAUSING se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web. Es responsabilidad del usuario revisar periódicamente estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Uso del Sitio Web</h2>
              <p className="text-gray-700 leading-relaxed">
                Al utilizar este sitio web, usted declara que tiene al menos 18 años de edad o que accede bajo la supervisión de un padre o tutor legal. Usted se compromete a utilizar este sitio web únicamente para fines legales y de manera que no infrinja los derechos de terceros.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Queda prohibido:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li>Usar el sitio para cualquier propósito ilegal o no autorizado</li>
                <li>Intentar acceder a áreas restringidas del sitio</li>
                <li>Transmitir virus u otro código malicioso</li>
                <li>Recopilar información de otros usuarios sin su consentimiento</li>
                <li>Interferir con el funcionamiento normal del sitio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Productos y Precios</h2>
              <p className="text-gray-700 leading-relaxed">
                Todos los productos mostrados en nuestro sitio web están sujetos a disponibilidad. Nos esforzamos por mostrar con la mayor precisión posible los colores y características de nuestros productos (colchones, sommiers, electrodomésticos y muebles), sin embargo, no podemos garantizar que la visualización en su dispositivo sea exacta.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Los precios mostrados están expresados en Pesos Argentinos (ARS) e incluyen IVA, salvo que se indique lo contrario. BAUSING se reserva el derecho de modificar los precios sin previo aviso. El precio aplicable será el vigente en el momento de confirmar el pedido.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Proceso de Compra</h2>
              <p className="text-gray-700 leading-relaxed">
                Para realizar una compra en BAUSING, deberá seguir los siguientes pasos:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2 mt-2">
                <li>Seleccionar los productos deseados y añadirlos al carrito</li>
                <li>Revisar el contenido del carrito y proceder al checkout</li>
                <li>Proporcionar los datos de envío y facturación</li>
                <li>Seleccionar el método de pago</li>
                <li>Confirmar el pedido</li>
              </ol>
              <p className="text-gray-700 leading-relaxed mt-3">
                Una vez confirmado el pedido, recibirá un correo electrónico de confirmación con los detalles de su compra y el número de seguimiento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Métodos de Pago</h2>
              <p className="text-gray-700 leading-relaxed">
                Aceptamos los siguientes métodos de pago:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li>Tarjetas de crédito (Visa, Mastercard, American Express)</li>
                <li>Tarjetas de débito</li>
                <li>Transferencia bancaria</li>
                <li>Pago en efectivo contra entrega (según disponibilidad en su zona)</li>
                <li>Financiación en cuotas (según promociones vigentes)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Todos los pagos son procesados de forma segura. BAUSING no almacena los datos completos de su tarjeta de crédito o débito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Envíos y Entregas</h2>
              <p className="text-gray-700 leading-relaxed">
                Realizamos envíos a todo el territorio de la República Argentina. Los plazos de entrega varían según la localidad y la disponibilidad del producto:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Córdoba Capital:</strong> 24-72 horas hábiles</li>
                <li><strong>Interior de Córdoba:</strong> 3-5 días hábiles</li>
                <li><strong>Resto del país:</strong> 5-10 días hábiles</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                El costo de envío se calculará al momento del checkout según el peso, volumen y destino de los productos. Para compras superiores a determinado monto, el envío puede ser bonificado según las promociones vigentes.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Para productos de gran tamaño (colchones, sommiers, electrodomésticos grandes), coordinaremos una fecha y horario de entrega con usted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Garantía</h2>
              <p className="text-gray-700 leading-relaxed">
                Todos nuestros productos cuentan con garantía según las disposiciones legales vigentes y las especificaciones del fabricante:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Colchones:</strong> Garantía de 3 a 10 años según el modelo</li>
                <li><strong>Sommiers:</strong> Garantía de 2 a 5 años según el modelo</li>
                <li><strong>Electrodomésticos:</strong> Garantía del fabricante (generalmente 1 año)</li>
                <li><strong>Muebles:</strong> Garantía de 6 meses a 1 año</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                La garantía cubre defectos de fabricación y no aplica para daños causados por mal uso, negligencia, accidentes o desgaste normal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Devoluciones y Cambios</h2>
              <p className="text-gray-700 leading-relaxed">
                Usted tiene derecho a devolver o cambiar los productos en los siguientes casos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><strong>Derecho de arrepentimiento:</strong> Dentro de los 10 días corridos desde la recepción del producto, puede solicitar la devolución sin necesidad de justificar el motivo (Ley 24.240 de Defensa del Consumidor).</li>
                <li><strong>Producto defectuoso:</strong> Si el producto presenta fallas de fábrica, realizaremos el cambio o reembolso sin cargo.</li>
                <li><strong>Producto diferente al pedido:</strong> Si recibe un producto distinto al solicitado, coordinaremos el cambio sin costo adicional.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Para iniciar una devolución o cambio, contáctenos a través de nuestro correo electrónico o teléfono de atención al cliente. El producto debe estar en su estado original, sin uso y con su embalaje completo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Propiedad Intelectual</h2>
              <p className="text-gray-700 leading-relaxed">
                Todo el contenido de este sitio web, incluyendo textos, gráficos, logotipos, íconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, es propiedad de BAUSING o de sus proveedores de contenido y está protegido por las leyes de propiedad intelectual argentinas e internacionales.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Queda prohibida la reproducción, distribución, modificación o uso comercial del contenido sin autorización expresa por escrito de BAUSING.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 leading-relaxed">
                BAUSING no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar nuestros productos o servicios. Nuestra responsabilidad máxima está limitada al precio de compra del producto en cuestión.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                No garantizamos que el sitio web esté libre de errores o que funcione de manera ininterrumpida. Nos reservamos el derecho de suspender temporalmente el servicio por mantenimiento o actualizaciones.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Ley Aplicable y Jurisdicción</h2>
              <p className="text-gray-700 leading-relaxed">
                Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Cualquier disputa que surja en relación con estos términos será sometida a la jurisdicción exclusiva de los tribunales ordinarios de la Ciudad de Córdoba, renunciando las partes a cualquier otro fuero que pudiera corresponderles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Si tiene alguna pregunta sobre estos Términos y Condiciones, puede contactarnos a través de:
              </p>
              <ul className="list-none text-gray-700 space-y-2 mt-3">
                <li><strong>Email:</strong> hola@bausing.com</li>
                <li><strong>Teléfono:</strong> +54 9 11 4049-0344</li>
                <li><strong>Dirección:</strong> Av. Corrientes 1234, Córdoba, Argentina</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
