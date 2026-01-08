const input=document.getElementById("taskInput");
const prioritySelect=document.getElementById("priority");
const addBtn=document.getElementById("addBtn");
const badge=document.getElementById("badge");
const reminderInput=document.getElementById("reminder");

const filterStatus=document.getElementById("filterStatus");
const filterPriority=document.getElementById("filterPriority");

const columns={
  todo: document.querySelector('[data-status="todo"] .list'),
  doing: document.querySelector('[data-status="doing"] .list'),
  done: document.querySelector('[data-status="done"] .list')
};

let tasks=[];
let draggedTaskId=null;
let accordionState={};

// --- Notification ---
function notifyHigh(task){
  if(!("Notification" in window) || Notification.permission!=="granted") return;
  const options={
    body: task.text,
    tag: "high_"+task.id,
    renotify:true,
    requireInteraction:true,
    actions:[{action:"done",title:"Виконано"}]
  };
  navigator.serviceWorker.getRegistration().then(reg=>reg.showNotification("🔥 Високий пріоритет",options));
}

// --- Schedule reminder ---
function scheduleReminder(task){
  if(!task.reminder || task.status==="done") return;
  const check=()=>{
    if(task.status!=="done"){
      notifyHigh(task);
      setTimeout(check,15*60*1000);
    }
  };
  const delay=new Date(task.reminder)-new Date();
  setTimeout(check,delay>0?delay:0);
}

// --- Accordion ---
function saveAccordionState(){ localStorage.setItem("accordionState",JSON.stringify(accordionState)); }
function loadAccordionState(){ accordionState=JSON.parse(localStorage.getItem("accordionState")||"{}"); }

// --- Render ---
function render(){
  Object.values(columns).forEach(c=>c.innerHTML="");
  let highCount=0;

  let filteredTasks=tasks.filter(t=>{
    if(filterStatus.value!=="all" && t.status!==filterStatus.value) return false;
    if(filterPriority.value!=="all" && t.priority!==filterPriority.value) return false;
    return true;
  });

  filteredTasks.sort((a,b)=>({"high":0,"normal":1,"low":2}[a.priority]-{"high":0,"normal":1,"low":2}[b.priority]));

  filteredTasks.forEach(t=>{
    const div=document.createElement("div");
    div.className="task "+t.priority;
    div.setAttribute("draggable","true");
    div.dataset.id=t.id;

    div.innerHTML=`
      <b>${t.text}</b>
      <small>${t.priority}</small>
      ${t.reminder?`<small>Нагадування: ${new Date(t.reminder).toLocaleString()}</small>`:""}
      <button class="delete-btn">✕</button>
    `;

    div.querySelector(".delete-btn").onclick=()=>{
      tasks=tasks.filter(task=>task.id!==t.id);
      deleteTask(t.id);
      render();
    };

    div.querySelector("b").onclick=()=>{
      t.status=t.status==="todo"?"doing":t.status==="doing"?"done":"todo";
      saveTask(t); render();
    };

    div.addEventListener("dragstart",e=>{
      draggedTaskId=t.id;
      div.classList.add("dragging");
    });
    div.addEventListener("dragend",e=>{
      draggedTaskId=null;
      div.classList.remove("dragging");
    });

    columns[t.status].appendChild(div);
    if(t.priority==="high") highCount++;
  });

  Object.values(columns).forEach(col=>{
    const parent=col.parentElement;
    parent.addEventListener("dragover",e=>{ e.preventDefault(); parent.classList.add("drag-over"); });
    parent.addEventListener("dragleave",e=>{ parent.classList.remove("drag-over"); });
    parent.addEventListener("drop",e=>{
      e.preventDefault(); parent.classList.remove("drag-over");
      if(!draggedTaskId) return;
      const task=tasks.find(t=>t.id==draggedTaskId);
      task.status=parent.dataset.status;
      saveTask(task); render();
    });
  });

  badge.textContent=highCount||"";
}

// --- Add task ---
addBtn.onclick=async()=>{
  if(!input.value || tasks.length>=100) return;

  const task={
    id:Date.now(),
    text:input.value,
    priority:prioritySelect.value,
    status:"todo",
    subtasks:[],
    comments:[],
    reminder:reminderInput.value?new Date(reminderInput.value).toISOString():null
  };

  tasks.push(task);
  await saveTask(task);
  if(task.priority==="high") notifyHigh(task);
  scheduleReminder(task);

  input.value="";
  reminderInput.value="";
  render();
};

// --- Filters ---
filterStatus.onchange=render;
filterPriority.onchange=render;

// --- Init ---
(async()=>{
  loadAccordionState();
  tasks=await getAllTasks();
  tasks.forEach(t=>scheduleReminder(t));
  render();

  if("Notification" in window && Notification.permission==="default") Notification.requestPermission();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
})();

// --- Handle SW message (mark done) ---
navigator.serviceWorker.addEventListener("message",e=>{
  if(e.data.action==="markDone"){
    const id=parseInt(e.data.tag.replace("high_",""));
    const task=tasks.find(t=>t.id===id);
    if(task){ task.status="done"; saveTask(task); render(); }
  }
});
