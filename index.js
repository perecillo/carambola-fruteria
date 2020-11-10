//Constantes
const {WebhookClient} = require('dialogflow-fulfillment');
const express = require('express')
const body_parser = require('body-parser')
const app = express().use(body_parser.json());
const {almacenaEnBBDD, consultaBBDD} = require('./bbdd')

// Routes
app.post('/', (request, response) => { 

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

  async function gestionaErrores(agent){
      if(agent.parameters.direccion_correcta) {
        data.direccion_envio = `${agent.parameters.direccion_correcta['street-address']} ${agent.parameters.direccion_correcta.city}`;
      } else if (agent.parameters.telefono_correcto){
        data.telefono_contacto = agent.parameters.telefono_correcto
      } else if (agent.parameters.frutas_correcto){
      }
      await almacenaEnBBDD(data);
      const datos_almacenados = await consultaBBDD(sessionId);
      agent.add(`Dato corregido!`)
      agent.add('El resumen de tu pedido es: '+datos_almacenados.productos)
      agent.add(`Dirección de entrega ${datos_almacenados.direccion_envio} y teléfono: ${datos_almacenados.telefono_contacto}`)
      agent.add('¿Es correcto?')
   }
 
  let intentMap = new Map();
  intentMap.set('Pedido - Productos', anotaProductos);
  intentMap.set('Pedido - Productos - Resumen', confirmaProductos)
  intentMap.set('Pedido - Productos - Resumen - Envio a domicilio', anotaEnvioDomicilio)
  intentMap.set('Pedido - Productos - Resumen - Envio a domicilio - Datos de envio', anotaDatosdeEnvio)
  intentMap.set('Pedido - Productos - Resumen - Envio a domicilio - Datos de envio - yes', anotaConfirmado)
  intentMap.set('Pedido - Productos - Resumen - Envio a domicilio - Datos de envio - no - Errores', gestionaErrores)
  agent.handleRequest(intentMap);
  
});

// Se levanta el servidor
app.listen(3000, () => console.log('-> Servidor listo! Esperando llamadas...'));
