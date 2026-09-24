const SHEET_NAME = 'Leads';
const FOLDER_NAME = 'Varaa Gold Visitor Cards';
const PROP_SECRET = 'CRM_SECRET';
const PROP_SHEET_ID = 'CRM_SHEET_ID';
const PROP_FOLDER_ID = 'CRM_FOLDER_ID';

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP_SECRET)) throw new Error('Set CRM_SECRET in Script Properties before running setup().');
  let ss;
  const sheetId = props.getProperty(PROP_SHEET_ID);
  if (sheetId) { try { ss = SpreadsheetApp.openById(sheetId); } catch (e) {} }
  if (!ss) { ss = SpreadsheetApp.create('Varaa Gold Smart Visitor CRM'); props.setProperty(PROP_SHEET_ID, ss.getId()); }
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(['Timestamp','Record ID','Mobile','Shop Name','Customer Type','Interests','Notes','Priority','Follow-up','Source','Card File URL']);
  let folder;
  const folderId = props.getProperty(PROP_FOLDER_ID);
  if (folderId) { try { folder = DriveApp.getFolderById(folderId); } catch (e) {} }
  if (!folder) {
    const it = DriveApp.getFoldersByName(FOLDER_NAME);
    folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
    props.setProperty(PROP_FOLDER_ID, folder.getId());
  }
}

function doGet(e) {
  const secret = e && e.parameter ? e.parameter.secret : '';
  if (!validSecret(secret)) return json({ error: 'Unauthorized' });
  const sh = getSheet(), values = sh.getDataRange().getValues();
  if (values.length < 2) return json({ leads: [] });
  const headers = values[0];
  const leads = values.slice(1).map(row => {
    const o = {}; headers.forEach((h,i) => o[h] = row[i]);
    const interests = o.Interests ? String(o.Interests).split(',').map(x=>x.trim()).filter(Boolean) : [];
    return { timestamp:o.Timestamp, recordId:o['Record ID'], mobile:o.Mobile, shopName:o['Shop Name'], customerType:o['Customer Type'], interests, notes:o.Notes, priority:o.Priority, followup:o['Follow-up'], source:o.Source, cardFileUrl:o['Card File URL'] };
  });
  return json({ leads });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (!validSecret(data.secret)) return json({ error: 'Unauthorized' });
    if (!data.mobile || !data.shopName || !data.cardImage) return json({ error: 'Mobile, shop name and card image are required.' });
    const sh = getSheet(), rows = sh.getDataRange().getValues();
    const normalizedMobile = normalizeMobile(data.mobile), normalizedShop = normalizeShop(data.shopName);
    let existing = false;
    for (let i=1;i<rows.length;i++) {
      const rowMobile = normalizeMobile(rows[i][2]), rowShop = normalizeShop(rows[i][3]);
      if ((normalizedMobile && rowMobile && normalizedMobile === rowMobile) || (normalizedShop && rowShop && normalizedShop === rowShop)) { existing = true; break; }
    }
    const now = new Date();
    const recordId = 'VG-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random()*1000);
    const file = saveCardImage(getFolder(), data.cardImage, recordId, data.shopName);
    const customerType = existing ? 'Existing Customer' : 'New Customer';
    sh.appendRow([now, recordId, String(data.mobile).trim(), String(data.shopName).trim(), customerType, (data.interests || []).join(', '), String(data.notes || ''), String(data.priority || 'Follow-up'), String(data.followup || 'Today'), String(data.source || 'GJIIE Chennai • Stall E36'), file.getUrl()]);
    return json({ ok:true, recordId, existingCustomer:existing, cardFileUrl:file.getUrl() });
  } catch (err) { return json({ error: err.message || 'Save failed.' }); }
}

function saveCardImage(folder, dataUrl, recordId, shopName) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid card image data.');
  const mime = match[1], bytes = Utilities.base64Decode(match[2]);
  const ext = mime.indexOf('png') >= 0 ? 'png' : mime.indexOf('webp') >= 0 ? 'webp' : 'jpg';
  const safeShop = String(shopName).replace(/[^a-z0-9_-]+/gi,'_').slice(0,50);
  return folder.createFile(Utilities.newBlob(bytes, mime, recordId + '_' + safeShop + '.' + ext));
}
function getSheet(){ return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID)).getSheetByName(SHEET_NAME); }
function getFolder(){ return DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty(PROP_FOLDER_ID)); }
function validSecret(v){ return !!v && v === PropertiesService.getScriptProperties().getProperty(PROP_SECRET); }
function normalizeMobile(v){ return String(v||'').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,''); }
function normalizeShop(v){ return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
function json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }