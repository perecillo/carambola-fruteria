//Constantes
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');

const credentials = {
  "type": "service_account",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": ""
}

const SPREADSHEET_ID = ``; //Se puede obtener de la url https://docs.google.com/spreadsheets/d/[ID]

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

// Routes
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response }); 
  console.log("session: "+agent.session)
  const sessionId = agent.session.split('/')[agent.session.split('/').length-1];  
  let data = {
    sessionId: sessionId,
    productos: "",
    tipo_de_entrega: "",
    direccion_envio: "",
    telefono_contacto: "",
    confirmado: ""
  }

  async function anotaProductos(agent){
    if (agent.parameters.number && agent.parameters.frutas) {
      data.productos = `- ${agent.parameters.number} ${agent.parameters.frutas}`
    } else if (agent.parameters['unit-weight'] && agent.parameters.frutas) {
      data.productos = `- ${agent.parameters['unit-weight'].amount} ${agent.parameters['unit-weight'].unit} ${agent.parameters.frutas}`
    }
    almacenaEnBBDD(data);
    agent.add(agent.consoleMessages)
  }

  async function confirmaProductos(agent){
    const datos_almacenados = await consultaBBDD(sessionId);
    agent.add(agent.consoleMessages)
    agent.add(datos_almacenados.productos)
    agent.add('¿Deseas envío a domicilio o recogida en tienda?')
  }

  async function anotaEnvioDomicilio(agent){
    data.tipo_de_entrega = "Envío a domicilio";
    almacenaEnBBDD(data);
    agent.add(agent.consoleMessages);
  }

  async function anotaDatosdeEnvio(agent){
    data.direccion_envio = `${agent.parameters.direccion_envio['street-address']} ${agent.parameters.direccion_envio.city}`;
    data.telefono_contacto = agent.parameters.telefono;
    await almacenaEnBBDD(data);
    const datos_almacenados = await consultaBBDD(sessionId);
    agent.add(agent.consoleMessages)
    agent.add('El resumen de tu pedido es: '+datos_almacenados.productos)
    agent.add('¿Es correcto?')
  }

  async function anotaConfirmado(agent){
   data.confirmado = "Si";
   await almacenaEnBBDD(data);
   agent.add(agent.consoleMessages);
  }

  let intentMap = new Map();
  intentMap.set('Pedido - Productos', anotaProductos);
  intentMap.set('Pedido - Productos - Resumen', confirmaProductos)
  intentMap.set('Pedido - Productos - Resumen - Envio a domicilio', anotaEnvioDomicilio)
  intentMap.set('Pedido - Productos - Resumen - Envio a domicilio - Datos de envio', anotaDatosdeEnvio)
  intentMap.set('Pedido - Productos - Resumen - Envio a domicilio - Datos de envio - yes', anotaConfirmado)
  agent.handleRequest(intentMap);
  
});

async function almacenaEnBBDD(data){
    // Accede al spreedsheet
    const {GoogleSpreadsheet} = require('google-spreadsheet')
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // número de hoja. Si solo hay una hoja es la 0
    const rows = await sheet.getRows();
    let existeFila = false;
  
    // Recorrojo la hoja para buscar ese sessionId
    for (var k = 0; k < rows.length; k++) {
      if(rows[k].sessionId.toString() === data.sessionId.toString()){ // Existe ese sessionId
        if(data.productos) rows[k].productos += `\n${data.productos}`;
        if(data.tipo_de_entrega) rows[k].tipo_de_entrega = data.tipo_de_entrega;
        if(data.direccion_envio) rows[k].direccion_envio = data.direccion_envio;
        if(data.telefono_contacto) rows[k].telefono_contacto = data.telefono_contacto;
        if(data.confirmado) rows[k].confirmado = data.confirmado;
        await rows[k].save()
        existeFila = true; 
      }
    }
    if(!existeFila){ //Si no existía la insertamos
      await sheet.addRow(data)
    }
  
}
  
async function consultaBBDD(sessionId){
      const {GoogleSpreadsheet} = require('google-spreadsheet')
      const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
      await doc.useServiceAccountAuth(credentials);
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0]; // número de hoja. Si solo hay una hoja es la 0
      const rows = await sheet.getRows();
      for (var k = 0; k < rows.length; k++) {
        if(rows[k].sessionId.toString() === sessionId.toString()){ // Existe ese sessionId
          let data = {}
          data.sessionId = sessionId;
          data.productos = rows[k].productos;
          data.tipo_de_entrega = rows[k].tipo_de_entrega,
          data.direccion_envio = rows[k].direccion_envio
          data.telefono_contacto = rows[k].telefono_contacto
          return(data)
        }
      }
  }

