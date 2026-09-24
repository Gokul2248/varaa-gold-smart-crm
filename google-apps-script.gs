/** VARAA Gold Smart Visitor CRM - Google Drive backend */
const SECRET = 'REPLACE_WITH_A_LONG_RANDOM_SECRET';
const SHEET_NAME = 'Leads';
const FOLDER_NAME = 'Varaa Gold Visitor Cards';
const PROP_SHEET_ID = 'VARAA_SHEET_ID';
const PROP_FOLDER_ID = 'VARAA_FOLDER_ID';

function setup(){
  const props=PropertiesService.getScriptProperties();
  let ssId=props.getProperty(PROP_SHEET_ID);
  let ss=ssId?SpreadsheetApp.openById(ssId):SpreadsheetApp.create('Varaa Gold Smart Visitor CRM');
  if(!ssId){props.setProperty(PROP_SHEET_ID,ss.getId());}
  let sh=ss.getSheetByName(SHEET_NAME)||ss.insertSheet(SHEET_NAME);
  if(sh.getLastRow()===0){sh.appendRow(['Timestamp','Name','Company','Designation','Mobile','Email','City','Customer Type','Interests','Notes','Priority','Follow-up','Source','Card File URL']);}
  let folderId=props.getProperty(PROP_FOLDER_ID);
  let folder=folderId?DriveApp.getFolderById(folderId):DriveApp.createFolder(FOLDER_NAME);
  if(!folderId)props.setProperty(PROP_FOLDER_ID,folder.getId());
  Logger.log('Spreadsheet: '+ss.getUrl());
  Logger.log('Folder: '+folder.getUrl());
}
function doGet(e){
  if(!e||e.parameter.secret!==SECRET)return json({ok:false,error:'Unauthorized'});
  if(e.parameter.action==='list')return listLeads();
  return json({ok:true,service:'Varaa Gold Smart Visitor CRM'});
}
function doPost(e){
  try{
    const p=JSON.parse(e.postData.contents||'{}');
    if(p.secret!==SECRET)return json({ok:false,error:'Unauthorized'});
    const props=PropertiesService.getScriptProperties();
    const ss=SpreadsheetApp.openById(props.getProperty(PROP_SHEET_ID));
    const sh=ss.getSheetByName(SHEET_NAME);
    const rows=sh.getDataRange().getValues();
    const mobile=String(p.mobile||'').replace(/\D/g,'');
    let existing=false;
    for(let i=1;i<rows.length;i++){
      const oldMobile=String(rows[i][4]||'').replace(/\D/g,'');
      const oldCompany=String(rows[i][2]||'').trim().toLowerCase();
      if((mobile&&oldMobile&&mobile.slice(-10)===oldMobile.slice(-10))||(p.company&&oldCompany&&String(p.company).trim().toLowerCase()===oldCompany)){existing=true;break;}
    }
    let cardUrl='';
    if(p.cardImage){
      const m=String(p.cardImage).match(/^data:(.*?);base64,(.*)$/);
      if(m){const blob=Utilities.newBlob(Utilities.base64Decode(m[2]),m[1],'card-'+Date.now()+'.jpg');const file=DriveApp.getFolderById(props.getProperty(PROP_FOLDER_ID)).createFile(blob);cardUrl=file.getUrl();}
    }
    sh.appendRow([new Date(),p.name||'',p.company||'',p.designation||'',p.mobile||'',p.email||'',p.city||'',existing?'Existing Customer':(p.customerType||'New Customer'),(p.interests||[]).join(', '),p.notes||'',p.priority||'',p.followup||'',p.source||'',cardUrl]);
    return json({ok:true,existingCustomer:existing});
  }catch(err){return json({ok:false,error:String(err)});}
}
function listLeads(){
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID));
  const sh=ss.getSheetByName(SHEET_NAME);const values=sh.getDataRange().getValues();
  if(values.length<2)return json({ok:true,leads:[]});
  const h=values[0];const leads=values.slice(1).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);o.interests=String(o.Interests||'').split(',').map(x=>x.trim()).filter(Boolean);o.timestamp=o.Timestamp instanceof Date?o.Timestamp.toISOString():String(o.Timestamp||'');delete o.Timestamp;delete o.Interests;return o;});
  return json({ok:true,leads:leads});
}
function json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
