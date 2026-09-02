# POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)
**HOMECARE COLORIMETRÍA**  
**Normatividad aplicable:** Ley Estatutaria 1581 de 2012, Decreto Reglamentario 1377 de 2013, Circular Externa 002 de 2015 de la Superintendencia de Industria y Comercio (SIC) de la República de Colombia.

---

### 1. IDENTIFICACIÓN DEL RESPONSABLE DEL TRATAMIENTO
* **Razón Social / Responsable:** HOMECARE COLORIMETRÍA
* **País de Operación:** República de Colombia
* **Canal de Atención de Habeas Data:** `soporte@homecare.works` / Sección de Ajustes en la App.

---

### 2. AUTORIZACIÓN PREVIA Y EXPRESA
Al registrarse en la aplicación Homecare o autorizar el acceso mediante credenciales de terceros (Google OAuth / Supabase Auth), el titular de los datos consiente de manera libre, previa, expresa e informada el tratamiento de sus datos personales, incluidos los de naturaleza sensible y biométrica (fotografías y geolocalización en tiempo real).

---

### 3. DATOS PERSONALES OBJETO DE TRATAMIENTO
La Plataforma recolecta y procesa los siguientes tipos de datos:
1. **Datos de Identificación y Contacto:** Nombre completo, correo electrónico, número de teléfono móvil, documento de identidad (para profesionales en proceso de validación) y dirección del domicilio del servicio.
2. **Datos de Geolocalización (GPS):** Coordenadas geográficas en primer plano (durante el uso activo de la app) y en segundo plano (para profesionales durante la ruta activa hacia el domicilio del cliente), utilizadas estrictamente para el cálculo de distancias, visualización en mapa y seguridad del servicio.
3. **Datos de Imagen y Evidencia Fotográfica:** Fotografía de perfil del usuario y fotografías tomadas antes y después del servicio como constancia del trabajo técnico realizado.
4. **Datos de Navegación y Transaccionales:** Identificadores únicos de dispositivo, tokens push para notificaciones, registros de chat interno entre cliente y proveedor, e historial de transacciones procesadas a través de pasarelas seguras (Mercado Pago). No se almacenan números completos de tarjetas de crédito ni códigos de seguridad CVV.

---

### 4. FINALIDADES DEL TRATAMIENTO
Los datos personales recolectados serán utilizados exclusivamente para:
* Conectar a usuarios clientes con profesionales de colorimetría y cuidado capilar cercanos.
* Permitir el seguimiento en mapa en tiempo real durante el desplazamiento y prestación del servicio.
* Validar la idoneidad y antecedentes de los profesionales independientes para salvaguarda de la comunidad.
* Enviar notificaciones sobre el estado de la solicitud, ofertas recibidas y confirmaciones de cita.
* Proveer soporte técnico, atención de peticiones, quejas y reclamos (PQR).
* Atender requerimientos legales de autoridades judiciales colombianas (Fiscalía General de la Nación, Policía Nacional, SIC) ante incidentes o denuncias penales.

---

### 5. DERECHOS DE LOS TITULARES (DERECHOS ARCO)
De conformidad con el artículo 8 de la Ley 1581 de 2012, el titular de los datos tiene derecho a:
1. **Conocer, actualizar y rectificar** sus datos personales en cualquier momento desde la pantalla de edición de perfil.
2. **Solicitar prueba de la autorización** otorgada para el tratamiento.
3. **Ser informado** del uso que se ha dado a sus datos personales.
4. **Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)** por infracciones a la ley de datos.
5. **Revocar la autorización y/o solicitar la supresión (eliminación de cuenta):** El titular puede eliminar y anonimizar su cuenta en cualquier momento mediante la opción directa *"Eliminar mi cuenta"* dispuesta en la aplicación, o mediante solicitud al correo `soporte@homecare.works`.

---

### 6. SEGURIDAD Y CONFIDENCIALIDAD
La Plataforma implementa medidas técnicas, humanas y administrativas para garantizar la confidencialidad de la información y mitigar riesgos de alteración, pérdida, acceso o tratamiento no autorizado:
* Base de datos protegida con Row Level Security (RLS) en PostgreSQL/Supabase.
* Transmisión de datos encriptada mediante protocolo SSL/TLS (HTTPS y WSS).
* Almacenamiento seguro de credenciales y tokens mediante encriptación nativa en el dispositivo (`Expo SecureStore`).

---

### 7. VIGENCIA DE LA POLÍTICA Y DE LA BASE DE DATOS
Esta Política entra en vigencia a partir de su publicación en Septiembre de 2026. Los datos personales permanecerán en la base de datos de la Empresa durante el tiempo que dure la relación contractual o según sea requerido para cumplir con obligaciones legales y fiscales colombianas.
