
async function almacenaEnBBDD(data){

    // Accede al spreedsheet
    const {credentials,SPREADSHEET_ID} = require('./credentials')
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
      const {credentials,SPREADSHEET_ID} = require('./credentials')
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

  module.exports = {almacenaEnBBDD, consultaBBDD}
  