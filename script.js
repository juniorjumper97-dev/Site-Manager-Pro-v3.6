let accounts = JSON.parse(localStorage.getItem('siteData')) || [];
let materials = JSON.parse(localStorage.getItem('storeMaterials')) || [{name: "Cement", unit: "Bags"}, {name: "Sand", unit: "Sud"}];
let stockTrans = JSON.parse(localStorage.getItem('storeTrans')) || [];
let currentType = 'worker';
let stockType = 'IN';

window.onload = function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = savedTheme + '-theme';
    document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('site-name').value = localStorage.getItem('savedSiteName') || "";
    renderAccounts(); updateMatDropdown(); renderInventory();
};

// --- Tabs & UI ---
function switchTab(id) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('btn-' + (id==='accounts'?'acc':id)).classList.add('active');
    document.getElementById('dashboard-section').style.display = (id === 'accounts') ? "block" : "none";
}

function toggleTheme() {
    const body = document.body;
    const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
    body.className = newTheme + '-theme';
    localStorage.setItem('theme', newTheme);
}

// --- Modal System ---
function showModal(msg, confirmCallback) {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('custom-modal').style.display = 'flex';
    document.getElementById('modal-confirm-btn').onclick = function() {
        confirmCallback();
        closeModal();
    };
}
function closeModal() { document.getElementById('custom-modal').style.display = 'none'; }

// --- Accounts Logic ---
function showInput(type) {
    currentType = type;
    document.getElementById('input-form').style.display = 'block';
    ['inc','lbr','use'].forEach(id => document.getElementById('toggle-'+id).classList.remove('active'));
    document.getElementById('toggle-' + (type==='income'?'inc':type==='worker'?'lbr':'use')).classList.add('active');
    const descInput = document.getElementById('entry-desc');
    if(type === 'income') descInput.placeholder = "ဝင်ငွေအကြောင်းအရာ";
    else if(type === 'worker') descInput.placeholder = "အလုပ်သမားအမည်";
    else descInput.placeholder = "အကြောင်းအရာ (ပစ္စည်း/အထွေထွေ)";
}

function confirmSave() {
    const desc = document.getElementById('entry-desc').value;
    const amt = Number(document.getElementById('entry-amt').value);
    const date = document.getElementById('entry-date').value;
    if(desc && amt > 0) {
        accounts.push({date, type: currentType, name: desc, total: amt});
        localStorage.setItem('siteData', JSON.stringify(accounts));
        renderAccounts();
        document.getElementById('entry-desc').value = ""; document.getElementById('entry-amt').value = "";
    }
}

function renderAccounts() {
    let wH = "", eH = "", iH = "", lS = 0, eS = 0, iS = 0, tS = 0;
    const today = new Date().toISOString().split('T')[0];
    accounts.forEach((item, idx) => {
        let row = `<tr><td>${item.date.slice(5)}</td><td>${item.name}</td><td>${item.total.toLocaleString()}</td><td><button onclick="delEntry(${idx})" style="color:red;background:none;border:none;">✕</button></td></tr>`;
        if(item.type === 'worker') { wH += row; lS += item.total; }
        else if(item.type === 'expense') { eH += row; eS += item.total; }
        else if(item.type === 'income') { iH += row; iS += item.total; }
        if(item.date === today && item.type !== 'income') tS += item.total;
    });
    document.getElementById('worker-table').innerHTML = wH;
    document.getElementById('expense-table').innerHTML = eH;
    document.getElementById('income-table').innerHTML = iH;
    document.getElementById('today-expense').innerText = tS.toLocaleString();
    document.getElementById('monthly-income').innerText = iS.toLocaleString();
    document.getElementById('balance-amount').innerText = (iS - (lS + eS)).toLocaleString();
}

function delEntry(idx) { accounts.splice(idx, 1); localStorage.setItem('siteData', JSON.stringify(accounts)); renderAccounts(); }

function clearAccountData() {
    showModal("Account စာရင်းများကိုသာ ဖျက်ပါမည်။ သေချာပါသလား?", function() {
        accounts = [];
        localStorage.setItem('siteData', JSON.stringify(accounts));
        renderAccounts();
    });
}

// --- Inventory & Store ---
function setStockType(type) {
    stockType = type;
    document.getElementById('toggle-stock-in').classList.toggle('active', type === 'IN');
    document.getElementById('toggle-stock-out').classList.toggle('active', type === 'OUT');
}

function saveStock() {
    const qty = Number(document.getElementById('stock-qty').value);
    const mat = document.getElementById('mat-select').value;
    if(qty > 0 && mat) {
        stockTrans.push({date: new Date().toISOString().split('T')[0], material: mat, type: stockType, qty});
        localStorage.setItem('storeTrans', JSON.stringify(stockTrans));
        renderInventory(); document.getElementById('stock-qty').value = "";
    }
}

function renderInventory() {
    document.getElementById('inventory-cards').innerHTML = materials.map(m => {
        let inQ = stockTrans.filter(t => t.material === m.name && t.type === 'IN').reduce((a,b)=>a+b.qty,0);
        let outQ = stockTrans.filter(t => t.material === m.name && t.type === 'OUT').reduce((a,b)=>a+b.qty,0);
        return `<div class="mini-card" style="flex:unset; width:calc(100%-10px)"><h4>${m.name}</h4><div>${inQ-outQ} <small>${m.unit}</small></div></div>`;
    }).join('');
    let hH = "", mH = "";
    stockTrans.forEach((t, i) => hH += `<tr><td>${t.date.slice(5)}</td><td>${t.material}</td><td>${t.qty}</td><td>${t.type}</td><td><button onclick="delStock(${i})" style="color:red;background:none;border:none;">✕</button></td></tr>`);
    document.getElementById('stock-history-table').innerHTML = hH;
    materials.forEach((m, i) => mH += `<tr><td>${m.name}</td><td>${m.unit}</td><td><button onclick="delMat(${i})" style="color:red;background:none;border:none;">✕</button></td></tr>`);
    document.getElementById('material-manage-table').innerHTML = mH;
}

function updateMatDropdown() {
    const sel = document.getElementById('mat-select');
    if(sel) sel.innerHTML = materials.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
}

function addMaterial() {
    const name = document.getElementById('new-mat-name').value;
    const unit = document.getElementById('new-mat-unit').value;
    if(name) {
        materials.push({name, unit});
        localStorage.setItem('storeMaterials', JSON.stringify(materials));
        updateMatDropdown(); renderInventory();
        document.getElementById('new-mat-name').value = "";
    }
}

function delStock(i) { stockTrans.splice(i,1); localStorage.setItem('storeTrans', JSON.stringify(stockTrans)); renderInventory(); }
function delMat(i) { materials.splice(i,1); localStorage.setItem('storeMaterials', JSON.stringify(materials)); updateMatDropdown(); renderInventory(); }

// --- Calculators ---
function toggleCalc(id) {
    const el = document.getElementById(id);
    const isVisible = el.style.display === 'block';
    document.querySelectorAll('.calc-box').forEach(b => b.style.display = 'none');
    el.style.display = isVisible ? 'none' : 'block';
}

function runConcrete() {
    const r = document.getElementById('con-ratio').value;
    const v = document.getElementById('c-v').value;
    let c = (r==='1:1.5:3')? v*33.6 : (r==='1:2:4')? v*28.5 : v*22.2;
    document.getElementById('res-con').innerText = `ဘိလပ်မြေ: ${Math.ceil(c)} အိတ်`;
}

function runBrick() {
    const a = document.getElementById('b-a').value;
    const t = document.getElementById('b-t').value;
    let res = (t == 9) ? a * 10 : a * 5;
    document.getElementById('res-brick').innerText = `အုတ်ချပ်ရေ: ${Math.round(res)} Nos`;
}

function runTimber() {
    const w = document.getElementById('t-w').value;
    const h = document.getElementById('t-h').value;
    const l = document.getElementById('t-l').value;
    const q = document.getElementById('t-q').value;
    let tons = (w * h * l * q) / 7200;
    document.getElementById('res-timber').innerText = `သစ်တန်: ${tons.toFixed(4)} Tons`;
}

// --- EXPORT & GOOGLE SHEETS BACKUP (v3.7) ---

async function exportAndUpload() {
    if (accounts.length === 0 && stockTrans.length === 0) {
        showModal("ထုတ်ယူရန် စာရင်းမရှိသေးပါ။", function(){});
        return;
    }

    const siteName = document.getElementById('site-name').value || "SiteReport";
    
    // ၁။ Excel သိမ်းသည့်အပိုင်း (Total များအပါအဝင်)
    try {
        const wb = XLSX.utils.book_new();
        
        let excelData = accounts.map(i => ({
            "နေ့စွဲ": i.date,
            "အမျိုးအစား": i.type.toUpperCase(),
            "အကြောင်းအရာ/အမည်": i.name,
            "ပမာဏ (ကျပ်)": i.total
        }));

        const lTotal = accounts.filter(i => i.type === 'worker').reduce((a,b)=>a+b.total, 0);
        const uTotal = accounts.filter(i => i.type === 'expense').reduce((a,b)=>a+b.total, 0);
        const iTotal = accounts.filter(i => i.type === 'income').reduce((a,b)=>a+b.total, 0);

        excelData.push({}); 
        excelData.push({"အကြောင်းအရာ/အမည်": "TOTAL LABOUR COST:", "ပမာဏ (ကျပ်)": lTotal});
        excelData.push({"အကြောင်းအရာ/အမည်": "TOTAL USAGE COST:", "ပမာဏ (ကျပ်)": uTotal});
        excelData.push({"အကြောင်းအရာ/အမည်": "TOTAL INCOME:", "ပမာဏ (ကျပ်)": iTotal});
        excelData.push({"အကြောင်းအရာ/အမည်": "NET BALANCE (လက်ကျန်):", "ပမာဏ (ကျပ်)": iTotal - (lTotal + uTotal)});

        const wsAcc = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, wsAcc, "Accounts");
        
        // Inventory Sheet လည်း ထည့်ပေးထားပါတယ်
        const invData = materials.map(m => {
            let inQ = stockTrans.filter(t => t.material === m.name && t.type === 'IN').reduce((a,b)=>a+b.qty,0);
            let outQ = stockTrans.filter(t => t.material === m.name && t.type === 'OUT').reduce((a,b)=>a+b.qty,0);
            return { "ပစ္စည်းအမည်": m.name, "လက်ကျန်": inQ-outQ, "ယူနစ်": m.unit };
        });
        const wsInv = XLSX.utils.json_to_sheet(invData);
        XLSX.utils.book_append_sheet(wb, wsInv, "Inventory");

        XLSX.writeFile(wb, `${siteName}_Report.xlsx`);
    } catch (e) { 
        console.error("Excel Error:", e); 
    }

    // ၂။ Google Sheets ဘက်သို့ ဒေတာပို့ခြင်း
    uploadToGoogleSheets(siteName);
}

async function uploadToGoogleSheets(siteName) {
    // အင်ဂျင်နီယာကြီးပေးထားတဲ့ Google Script URL
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby7h2usP6eMCf10ycG-C26XV2VHttqweDToCswmZaHp0rnddvM4GbKKT0qggmzBQjIV-w/exec';

    const dataToSave = {
        project: siteName,
        accounts: accounts,
        stock: stockTrans
    };

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
        showModal("Excel ထုတ်ယူပြီးပါပြီ ခင်ဗျာ။", function(){});
    } catch (e) {
        console.error("Google Sheets Error:", e);
        alert("အင်တာနက် စစ်ဆေးပေးပါ။");
    }
}

function saveSiteName() { 
    localStorage.setItem('savedSiteName', document.getElementById('site-name').value); 
}