# Carambola Frutería

Carambola frutería es un proyecto con fines educativos para mostrar algunas características interesantes de Dialogflow para la creación de un asistente virtual para un e-commerce.

## Instalación 🔧

Crea un agente en dialogflow.cloud.google.com e importa el fichero .zip disponible en la carpeta AgenteDialogflow.

Ve al proyecto de Google Cloud asociado al agente de Dialogflow clicando sobre Ajustes > General > click sobre el nombre del proyecto.

Busca la opción IAM & Admin > Service Accounts > + Create Service Account > Da un nombre a la cuenta de servicio, dale permisos de "Dialogflow API Client" 
En el listado que aparece a continuación de cuestas de servicio, selecciona las opciones de la que acabas de crear y pulsa sobre "Create Key" > JSON
Copia el contenido del fichero dentro del fichero credentials.js, service-account-telegram.json e index-inline.js en la constante credentials.
Ahora hay que darle permisos a esa cuenta de servicio para que acceda a:
* Google Sheets: crea un google spreadsheet y compartelo con la cuenta de servicio Share > añadir la dirección de correo que aparece en las credenciales en el campo client_email. En el fichero credentials.js añade tb el ID del google spreadsheet que se puede obtener de la url https://docs.google.com/spreadsheets/d/[ID] y en el fichero index-inline.js pégalo en la constante SPREADSHEET_ID.
* Activa la Google Sheets API desde el proyecto de Google cloud buscando "Google Sheets API" y pulsando sobre habilitar. Ídem con Cloud Vision API.

Nota: es posible que tengas que asigar una cuenta de facturación al proyecto (con su correspondiente tarjeta de crédito) para activar todas estas funcionalidades. En general, para un uso didáctico no debería cobrarte nada porque el uso que se va a hacer es bajo.

Una vez que tienes todo configurado, tienes varias partes que probar:
* Agente de Dialogflow
* Fulfillment (webhook o in-line editor)
* Adaptador de canal Telegram con visión artificial

### Agente de Dialogflow

En el agente de Dialogflow creado en la instalación ve a Ajustes > Export and Import > Restore from zip. 
Selecciona el fichero AgenteDialogflow > Carambola-Frutería_Agente_Dialogflow.zip

Ahora ya tendrás los intens de la frutería y podrás probarlos en la consola de prueba a la derecha en Dialogflow.

### Fulfillment. Opción 1 - Webhook

En la versión webhook usarmos el fichero index.js.

Primero instalamos las dependencias del proyecto:

```
npm i
node index.js
```
Si todas las credenciales son correctas ya tendremos nuestro servidor escuchando en localhost. Ahora deberemos exponer el servicio a internet, para ello podemos utilizar la herramienta ngrok y ejecutar el comando:

```
ngrok http 3000
```

Si no tienes la herramienta ngrok puedes descargarla aquí: https://ngrok.com/download

A continuación en Dialogflow ve a la pestaña Fulfillment y seleccionar Webhook e introducir la URL que ha devuelto ngrok en el paso anterior (la url con https)

### Fulfillment. Opción 2 - Inline editor

Entra en el agente de Dialogflow y copia el código del fichero AgenteDialogflow > index-inline.js. Pégalo en la pestaña index.js. En la package.json copia y pega las dependencias nuevas que no estén en apartado "dependencies".

Pulsa sobre Deploy y espera a que el servicio esté publicado. 

Nota: es posible que tengas que asigar una cuenta de facturación al proyecto 

### Adaptador de canal Telegram con visión artificial

Por último si quieres probar el adaptador de canal para Telegram con visión artificial sigue los siguientes pasos:
* Entra en Telegram y busca el contacto BotFather. Escribe /newbot y sigue las instrucciones. Al final unos sencillos pasos BotFather te entregará un token que deberás pegar en el fichero AdaptadorTelegram > config-telegram.js en la constante Telegram_token. También rellena el id del agente de Dialogflow en la constante projectIdDF. Este ID lo puedes obtener en Dialogflow > Ajustes > Project ID.

Para ejecutar el adaptador:

```
cd AdaptadorTelegram
node adaptador_Canal_Telegram.js
```

Ahora entra en Telegram, busca el bot que acabas de crear y comienza a hablar.

# Autor

David Faustino Pérez García

Gracias, cualquier duda en los comentarios!

Happy coding





