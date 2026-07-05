// โครงสร้างข้อมูลสำหรับ 3 ไลน์การผลิตแยกเป็นอิสระ
let lines = {
    1: { active: 0, stock: 0, newJob: 0, countdown: 0, isRunning: false },
    2: { active: 0, stock: 0, newJob: 0, countdown: 0, isRunning: false },
    3: { active: 0, stock: 0, newJob: 0, countdown: 0, isRunning: false }
};

let configTotalSeconds = 240;
let configWarnThreshold = 5;
let configDangerThreshold = 3;

let masterInterval = null; // คุมเวลาของทุกไลน์ด้วย Loop กลางอันเดียวเพื่อเสถียรภาพสูงสุด

// ปรับแต่งสีของแท่งใช้งานชั้นล่างสุดตามเกณฑ์ความวิกฤต
function applyActiveColor(lineId) {
    const el = document.getElementById(`bar-l${lineId}-active`);
    el.classList.remove('status-normal', 'status-warning', 'status-danger');
    let val = lines[lineId].active;
    
    if (val <= configDangerThreshold) el.classList.add('status-danger');
    else if (val < configWarnThreshold) el.classList.add('status-warning');
    else el.classList.add('status-normal');
}

// คำนวณความสูงสัดส่วนและอัปเดตยอดตัวเลขบนกราฟ
function updateLineChart(lineId) {
    const lData = lines[lineId];
    const total = lData.active + lData.stock + lData.newJob;
    
    const elAct = document.getElementById(`bar-l${lineId}-active`);
    const elStk = document.getElementById(`bar-l${lineId}-stock`);
    const elNew = document.getElementById(`bar-l${lineId}-new`);
    
    if (total === 0) {
        elAct.style.height = "0%"; elStk.style.height = "0%"; elNew.style.height = "0%";
        document.getElementById(`val-l${lineId}-active`).textContent = 0;
        document.getElementById(`val-l${lineId}-stock`).textContent = 0;
        document.getElementById(`val-l${lineId}-new`).textContent = 0;
        return;
    }

    elAct.style.height = `${(lData.active / total) * 100}%`;
    elStk.style.height = `${(lData.stock / total) * 100}%`;
    elNew.style.height = `${(lData.newJob / total) * 100}%`;

    document.getElementById(`val-l${lineId}-active`).textContent = lData.active;
    document.getElementById(`val-l${lineId}-stock`).textContent = lData.stock;
    document.getElementById(`val-l${lineId}-new`).textContent = lData.newJob;
    
    applyActiveColor(lineId);
}

// ตรรกะการรันเวลากลาง เช็ครายวินาทีแยกเป็นรายไลน์
function runMasterTick() {
    masterInterval = setInterval(() => {
        let anyLineRunning = false;

        for (let i = 1; i <= 3; i++) {
            if (lines[i].isRunning) {
                anyLineRunning = true;
                lines[i].countdown--;
                document.getElementById(`timer-l${i}`).textContent = formatDisplayTime(lines[i].countdown);

                if (lines[i].countdown <= 0) {
                    if (lines[i].active > 0) {
                        lines[i].active--;
                        updateLineChart(i);
                    }

                    if (lines[i].active === 0) {
                        triggerLinePuzzleShift(i);
                    } else {
                        lines[i].countdown = configTotalSeconds;
                    }
                }
            }
        }

        if (!anyLineRunning) {
            stopMasterTimer();
        }
    }, 1000);
}

// เอฟเฟกต์ถดถอยและเลื่อนแถว Puzzle เมื่อกลุ่มใช้งานกลายเป็น 0 
function triggerLinePuzzleShift(lineId) {
    const elAct = document.getElementById(`bar-l${lineId}-active`);
    const elStk = document.getElementById(`bar-l${lineId}-stock`);
    const elNew = document.getElementById(`bar-l${lineId}-new`);
    
    lines[lineId].isRunning = false;
    elAct.classList.remove('blink-active');
    elAct.classList.add('puzzle-disappear');

    setTimeout(() => {
        lines[lineId].active = lines[lineId].stock;
        lines[lineId].stock = lines[lineId].newJob;
        lines[lineId].newJob = 0;

        elAct.classList.remove('puzzle-disappear');
        elStk.classList.add('puzzle-fall');
        elNew.classList.add('puzzle-fall');

        updateLineChart(lineId);

        setTimeout(() => {
            elStk.classList.remove('puzzle-fall');
            elNew.classList.remove('puzzle-fall');

            if (lines[lineId].active > 0 || lines[lineId].stock > 0) {
                lines[lineId].countdown = configTotalSeconds;
                if (document.getElementById('btn-master-start').disabled) {
                    lines[lineId].isRunning = true;
                    elAct.classList.add('blink-active');
                }
            } else {
                document.getElementById(`timer-l${lineId}`).textContent = "หมด!!";
                document.getElementById(`btn-toggle-l${lineId}`).disabled = true;
            }
        }, 400);
    }, 400);
}

function stopMasterTimer() {
    clearInterval(masterInterval);
    masterInterval = null;
}

function formatDisplayTime(secs) {
    let minutes = Math.floor(secs / 60);
    let seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// เพิ่มงานใหม่เข้าแผงสีฟ้าแบบสดๆ (Real-time Live Add) 
function liveAddJob(lineId) {
    const inputEl = document.getElementById(`add-l${lineId}-val`);
    let addVal = parseInt(inputEl.value) || 0;
    if (addVal <= 0) { alert("กรุณาใส่ยอดงานมากกว่า 0"); return; }
    
    lines[lineId].newJob += addVal;
    updateLineChart(lineId);
    
    if (lines[lineId].active === 0 && lines[lineId].stock === 0 && lines[lineId].newJob === addVal) {
        triggerLinePuzzleShift(lineId);
        document.getElementById(`btn-toggle-l${lineId}`).disabled = false;
    }
}

// ผูกฟังก์ชันปุ่ม "หยุด/เดินต่อ" แยกตามแต่ละไลน์
function setupLineToggleButton(i) {
    const btn = document.getElementById(`btn-toggle-l${i}`);
    btn.addEventListener('click', () => {
        const card = document.getElementById(`card-l${i}`);
        const barAct = document.getElementById(`bar-l${i}-active`);
        
        if (lines[i].isRunning) {
            lines[i].isRunning = false;
            card.classList.add('paused');
            barAct.classList.remove('blink-active');
            btn.textContent = `เดินต่อไลน์ ${i}`;
            btn.className = "btn btn-line-toggle pause";
        } else {
            if (lines[i].active === 0 && lines[i].stock === 0 && lines[i].newJob === 0) return;
            lines[i].isRunning = true;
            card.classList.remove('paused');
            barAct.classList.add('blink-active');
            btn.textContent = `หยุดไลน์ ${i}`;
            btn.className = "btn btn-line-toggle run";
            
            if (!masterInterval) runMasterTick();
        }
    });
}
for (let i = 1; i <= 3; i++) { setupLineToggleButton(i); }

// --- Master Control Panel Listeners ---
document.getElementById('btn-master-start').addEventListener('click', () => {
    let totalJobs = 0;
    for (let i = 1; i <= 3; i++) {
        totalJobs += (lines[i].active + lines[i].stock + lines[i].newJob);
    }
    if (totalJobs === 0) { alert("ไม่มีงานอยู่ในระบบเลยสักไลน์เดียว กรุณากด Reset เพื่อตั้งค่ายอดงานก่อนครับ"); return; }

    document.getElementById('btn-master-start').disabled = true;
    document.getElementById('btn-master-stop').disabled = false;

    for (let i = 1; i <= 3; i++) {
        if (lines[i].active > 0 || lines[i].stock > 0 || lines[i].newJob > 0) {
            const card = document.getElementById(`card-l${i}`);
            if (!card.classList.contains('paused')) {
                lines[i].isRunning = true;
                document.getElementById(`bar-l${i}-active`).classList.add('blink-active');
                document.getElementById(`btn-toggle-l${i}`).disabled = false;
                document.getElementById(`btn-toggle-l${i}`).textContent = `หยุดไลน์ ${i}`;
                document.getElementById(`btn-toggle-l${i}`).className = "btn btn-line-toggle run";
            }
        }
    }
    if (!masterInterval) runMasterTick();
});

document.getElementById('btn-master-stop').addEventListener('click', () => {
    document.getElementById('btn-master-start').disabled = false;
    document.getElementById('btn-master-stop').disabled = true;
    
    stopMasterTimer();
    for (let i = 1; i <= 3; i++) {
        lines[i].isRunning = false;
        document.getElementById(`bar-l${i}-active`).classList.remove('blink-active');
        document.getElementById(`btn-toggle-l${i}`).disabled = true;
    }
});

document.getElementById('btn-master-reset').addEventListener('click', () => {
    stopMasterTimer();
    lines = {
        1: { active: 0, stock: 0, newJob: 0, countdown: 0, isRunning: false },
        2: { active: 0, stock: 0, newJob: 0, countdown: 0, isRunning: false },
        3: { active: 0, stock: 0, newJob: 0, countdown: 0, isRunning: false }
    };
    
    for (let i = 1; i <= 3; i++) {
        updateLineChart(i);
        const card = document.getElementById(`card-l${i}`);
        card.classList.remove('paused');
        document.getElementById(`btn-toggle-l${i}`).disabled = true;
        document.getElementById(`timer-l${i}`).textContent = formatDisplayTime(configTotalSeconds);
    }
    
    document.getElementById('btn-master-start').disabled = false;
    document.getElementById('btn-master-stop').disabled = true;
    
    document.getElementById('page-dashboard').classList.remove('active');
    document.getElementById('page-setup').classList.add('active');
});

// บันทึกหน้าแรก สลับหน้าจอไป Dashboard หลัก
document.getElementById('btn-submit-all').addEventListener('click', () => {
    for (let i = 1; i <= 3; i++) {
        lines[i].newJob = parseInt(document.getElementById(`setup-l${i}-new`).value) || 0;
        lines[i].stock = parseInt(document.getElementById(`setup-l${i}-stock`).value) || 0;
        lines[i].active = parseInt(document.getElementById(`setup-l${i}-active`).value) || 0;
        lines[i].countdown = configTotalSeconds;
        
        document.getElementById(`timer-l${i}`).textContent = formatDisplayTime(configTotalSeconds);
        updateLineChart(i);
    }
    document.getElementById('page-setup').classList.remove('active');
    document.getElementById('page-dashboard').classList.add('active');
});

// --- Settings Modal ---
const modal = document.getElementById('settings-modal');
document.getElementById('btn-open-settings').addEventListener('click', () => {
    document.getElementById('modal-min').value = Math.floor(configTotalSeconds / 60);
    document.getElementById('modal-sec').value = configTotalSeconds % 60;
    document.getElementById('modal-warn').value = configWarnThreshold;
    document.getElementById('modal-danger').value = configDangerThreshold;
    modal.classList.add('active');
});
document.getElementById('btn-modal-close').addEventListener('click', () => modal.classList.remove('active'));
document.getElementById('btn-modal-save').addEventListener('click', () => {
    let m = parseInt(document.getElementById('modal-min').value) || 0;
    let s = parseInt(document.getElementById('modal-sec').value) || 0;
    if(m < 0) m = 0; if(s < 0) s = 0; if(s > 59) s = 59;
    if(m === 0 && s === 0) s = 4;
    configTotalSeconds = (m * 60) + s;

    let w = parseInt(document.getElementById('modal-warn').value) || 5;
    let d = parseInt(document.getElementById('modal-danger').value) || 3;
    if(w < 1) w = 1; if(d < 1) d = 1;
    if(d >= w) d = w - 1;

    configWarnThreshold = w;
    configDangerThreshold = d;

    document.getElementById('setup-time-preview').textContent = formatDisplayTime(configTotalSeconds);
    modal.classList.remove('active');
});