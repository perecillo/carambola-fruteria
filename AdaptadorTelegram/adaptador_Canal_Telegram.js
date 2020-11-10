
const dialogflow = require("dialogflow");
const TelegramBot = require('node-telegram-bot-api');
const credentialsTelegram = {
    keyFilename: "./service-account-telegram.json"
  };
const {Telegram_token, projectIdDF} = require("./config-telegram")
const bot = new TelegramBot(Telegram_token, {polling: true});
const sessionClient = new dialogflow.SessionsClient(credentialsTelegram);
const contextsClient = new dialogflow.ContextsClient(credentialsTelegram);

bot.on('message', async (msg) => {
  console.log(JSON.stringify(msg));
  const chatId = msg.chat.id;
  const sessionId = chatId.toString();//msg.from.id.toString();
  const sessionPath = sessionClient.sessionPath(projectIdDF, sessionId); 
  console.log("sessionPath: "+sessionPath);
  if (msg.text) { // Texto
    var request_dialogflow = {
        session: sessionPath,
        queryInput: {
            text: {
            text: msg.text,
            languageCode: "es-ES"
            }
        }
    };
    const responses = await sessionClient.detectIntent(request_dialogflow);
    gestionaMensajesDF(responses, chatId);  
  } 
  else if (msg.location) { // Ubicación
    var request_dialogflow = {
      session: sessionPath,
      queryInput: {
          text: {
          text: 'ubicacion',
          languageCode: "es-ES"
          }
      }
    };
    const responses = await sessionClient.detectIntent(request_dialogflow);
    gestionaMensajesDF(responses, chatId);  
    let data_recomendador = {
      id_usuario: chatId,
      nombre: msg.from.first_name,
      idioma: msg.from.language_code,
      longitud: msg.location.longitude,
      latitud: msg.location.latitude
    }
    console.log("----------> "+JSON.stringify(responses[0].queryResult.parameters))
    if (responses[0].queryResult.parameters && responses[0].queryResult.parameters.fields.edad){
      data_recomendador.edad = responses[0].queryResult.parameters.fields.edad.numberValue
    }
    ingestaDatosRecomendador(data_recomendador);
  } 
  else if (msg.photo) { // Imágen
    console.log(JSON.stringify(msg.photo))
    var photo_index_max_resolution = 0;
    var max_resolution = 0;
    for (var i = 0; i < msg.photo.length; i++) {
      if (max_resolution < msg.photo[i].height * msg.photo[i].width){
        photo_index_max_resolution = i
        max_resolution = msg.photo[i].height * msg.photo[i].width
      }
    } 
    const image_url = await bot.downloadFile(msg.photo[photo_index_max_resolution].file_id, "./");
    const labels = await vision_artificial(image_url);  
    for (var i = 0; i < labels.length; i++) {
      const contextPath = contextsClient.contextPath(projectIdDF,sessionId,labels[i].name.toLowerCase());
      var createContextRequest = {
          parent: sessionPath,
          context: {
            name: contextPath,
            lifespanCount: 2,
            
          }
        }
      const a = await contextsClient.createContext(createContextRequest); 
  }
  var request_dialogflow = {
    session: sessionPath,
    queryInput: {
        text: {
        text: 'foto',
        languageCode: "es-ES"
        }
    }
  };
  const responses = await sessionClient.detectIntent(request_dialogflow);
  gestionaMensajesDF(responses, chatId);  
}
});

bot.on("callback_query", async function(data){
  console.log(JSON.stringify(data));
  const chatId = data.from.id;
  const sessionId = data.from.id.toString();
  const sessionPath = sessionClient.sessionPath(projectIdDF, sessionId);
  // Texto
  var request_dialogflow = {
      session: sessionPath,
      queryInput: {
          text: {
          text: data.data,
          languageCode: "es-ES"
          }
      }
  }
  const responses = await sessionClient.detectIntent(request_dialogflow);
  gestionaMensajesDF(responses, chatId);
});

async function gestionaMensajesDF(responses, chatId){
  var mensajes = responses[0].queryResult.fulfillmentMessages;
  console.log("DF: "+JSON.stringify(mensajes));
  let mensajesEspecificosTelegram = false;
  for (var i = 0; i < mensajes.length; i++) {
    if (mensajes[i].platform === 'TELEGRAM') {
      mensajesEspecificosTelegram = true;
      // Cards
      if (mensajes[i].message === 'card') {
        //if (mensajes[i].card.title) await bot.sendMessage(chatId, mensajes[i].card.title)
        if (mensajes[i].card.imageUri) await bot.sendPhoto(chatId, mensajes[i].card.imageUri);
        if (mensajes[i].card.buttons) {
          const btns = mensajes[i].card.buttons;
          let botones_TE = {
            reply_markup: {
                inline_keyboard: []
            }
          }
          for (var j = 0; j < btns.length; j++) {
            botones_TE.reply_markup.inline_keyboard.push([{"text":btns[j].text,"callback_data":btns[j].text}])
          }
          await bot.sendMessage(chatId, mensajes[i].card.title, botones_TE)
        }
      } 
      // Text
      else if (mensajes[i].message === 'text'){
        await bot.sendMessage(chatId, mensajes[i].text.text[0]);
      } 
      // quickReplies
      else if (mensajes[i].message === 'quickReplies'){
        let botones_TE = {
          reply_markup: {
              inline_keyboard: []
          }
        }
        // Insertamos los botones en el mensaje para Telegram
        var botones_DF = mensajes[i].quickReplies.quickReplies;
        for (var j = 0; j < botones_DF.length; j++) {
          botones_TE.reply_markup.inline_keyboard.push([{"text":botones_DF[j],"callback_data":botones_DF[j]}])
        }
        await bot.sendMessage(chatId, mensajes[i].quickReplies.title, botones_TE)
      } 
      // Imagen
      else if (mensajes[i].message === 'image'){
        await bot.sendPhoto(chatId, mensajes[i].image.imageUri);
      } 
    }
    if (mensajes[i].platform === 'PLATFORM_UNSPECIFIED' && !mensajesEspecificosTelegram) {
      await bot.sendMessage(chatId, mensajes[i].text.text[0]);
    }
  }
}

async function vision_artificial(url_image) {
  return new Promise((resolve, reject)=>{ 
  const vision = require('@google-cloud/vision');
  // Creates a client
  const client = new vision.ImageAnnotatorClient(credentialsTelegram);
  client.objectLocalization(url_image).then(([result]) =>{
    console.log(result);
    const labels = result.localizedObjectAnnotations;
    resolve(labels)
  })
})
}
