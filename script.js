// ========== 原有功能代码 ==========
// 在文件顶部添加
let isManageMode = false;
let selectedImages = [];

let currentAvatarId = null;
// 默认头像路径
const defaultAvatars = {
  avatar1: "images/qinbaotai.png",
  avatar2: "images/yanxuran.png"
};
// 默认恋爱起始时间
const DEFAULT_LOVE_DATE = "2024-02-26T00:00:00+08:00";
// 保存原始日期值，用于取消时恢复
let originalLoveDate = "";

// 打开弹窗
function openModal(modalId, avatarId = null) {
  if (modalId === 'avatarModal' && avatarId) {
    currentAvatarId = avatarId;
  }
  if (modalId === 'loveDateModal') {
    // 保存原始值
    originalLoveDate = getLoveDate().substring(0, 10);
    document.getElementById('loveDateInModal').value = originalLoveDate;
  }
  document.getElementById(modalId).classList.remove("hidden");
  
  // 如果是 loveDateModal，阻止事件冒泡
  if (modalId === 'loveDateModal') {
    return false;
  }
}

// 关闭弹窗
function closeModal(modalId) {
  if (modalId === 'loveDateModal') {
    // 恢复原始值
    document.getElementById('loveDateInModal').value = originalLoveDate;
  }
  document.getElementById(modalId).classList.add("hidden");
  if (modalId === 'avatarModal') {
    currentAvatarId = null;
    document.getElementById("avatarFileInput").value = "";
  }
}

// 头像上传和保存
document.getElementById("avatarFileInput").addEventListener("change", function (event) {
  if (event.target.files && event.target.files[0] && currentAvatarId) {
    let reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById(currentAvatarId).src = e.target.result;
      localStorage.setItem(currentAvatarId, e.target.result);
    };
    reader.readAsDataURL(event.target.files[0]);
  }
});

// 恢复默认头像
function resetAvatar() {
  if (currentAvatarId) {
    localStorage.removeItem(currentAvatarId);
    document.getElementById(currentAvatarId).src = defaultAvatars[currentAvatarId];
  }
  closeModal('avatarModal');
}

// 初始化头像
['avatar1','avatar2'].forEach(id => {
  const saved = localStorage.getItem(id);
  if (saved) {
    document.getElementById(id).src = saved;
  } else {
    document.getElementById(id).src = defaultAvatars[id];
  }
});

// 个人信息表格
const PERSONAL_INFO_KEY = 'personalInfoTable_v1';
const fallbackPersonalInfo = [
  { project: "年龄", ta: "22", me: "23" },
  { project: "爱好", ta: "运动", me: "睡觉" },
  { project: "游戏", ta: "王者", me: "蛋仔" }
];

function createInfoRow(project = '', ta = '', me = '') {
  const tr = document.createElement('tr');
  const tdProj = document.createElement('td');
  tdProj.className = 'border p-2';
  const inpProj = document.createElement('input');
  inpProj.type = 'text';
  inpProj.placeholder = '项目';
  inpProj.className = 'w-full p-1 border rounded project-input';
  inpProj.value = project;
  tdProj.appendChild(inpProj);

  const tdTa = document.createElement('td');
  tdTa.className = 'border p-2';
  const inpTa = document.createElement('input');
  inpTa.type = 'text';
  inpTa.placeholder = '老公 💙';
  inpTa.className = 'w-full p-1 border rounded ta-input';
  inpTa.value = ta;
  tdTa.appendChild(inpTa);

  const tdMe = document.createElement('td');
  tdMe.className = 'border p-2 flex items-center gap-2';
  const inpMe = document.createElement('input');
  inpMe.type = 'text';
  inpMe.placeholder = '老婆 💖';
  inpMe.className = 'w-full p-1 border rounded me-input';
  inpMe.value = me;
  tdMe.appendChild(inpMe);

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'ml-2 px-2 py-1 bg-red-400 text-white rounded text-sm';
  delBtn.textContent = '删';
  delBtn.onclick = () => { tr.remove(); };
  tdMe.appendChild(delBtn);

  tr.appendChild(tdProj);
  tr.appendChild(tdTa);
  tr.appendChild(tdMe);
  return tr;
}

function addInfoRow() {
  const tbody = document.getElementById('infoTableBody');
  tbody.appendChild(createInfoRow());
}

function saveTableInfo() {
  const rows = document.querySelectorAll('#infoTableBody tr');
  const data = [];
  rows.forEach(row => {
    const project = row.querySelector('.project-input')?.value || '';
    const ta = row.querySelector('.ta-input')?.value || '';
    const me = row.querySelector('.me-input')?.value || '';
    if (project.trim() === '' && ta.trim() === '' && me.trim() === '') return;
    data.push({ project, ta, me });
  });
  localStorage.setItem(PERSONAL_INFO_KEY, JSON.stringify(data));
  showNotification('已保存 ✅');
}

function loadTableInfo() {
  const tbody = document.getElementById('infoTableBody');
  tbody.innerHTML = '';
  const saved = localStorage.getItem(PERSONAL_INFO_KEY);

  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length > 0) {
        arr.forEach(r => tbody.appendChild(createInfoRow(r.project, r.ta, r.me)));
        return;
      }
    } catch (e) {
      console.warn("解析 localStorage 失败：", e);
    }
  }

  const defaultInfo = (window.defaultPersonalInfo && Array.isArray(window.defaultPersonalInfo))
    ? window.defaultPersonalInfo
    : fallbackPersonalInfo;

  defaultInfo.forEach(r => tbody.appendChild(createInfoRow(r.project, r.ta, r.me)));
}

// 相爱时长功能（修复显示问题）
function getLoveDate() {
  return localStorage.getItem("loveDate") || DEFAULT_LOVE_DATE;
}

function saveLoveDateFromModal() {
  const inputDate = document.getElementById('loveDateInModal').value;
  if (inputDate) {
    const finalDate = `${inputDate}T00:00:00+08:00`;
    localStorage.setItem("loveDate", finalDate);
    calcLoveTime();
    closeModal('loveDateModal');
    showNotification('时间已更新 ❤️');
  }
}

// 重置输入框为默认日期，但不保存
function resetLoveDateInput() {
  document.getElementById('loveDateInModal').value = DEFAULT_LOVE_DATE.substring(0, 10);
}

// 核心修复：确保时间计算并正确显示
function calcLoveTime() {
  const start = new Date(getLoveDate());
  const now = new Date();
  let diff = Math.floor((now - start) / 1000);
  if (diff < 0) diff = 0;

  const years = Math.floor(diff / (365 * 24 * 3600));
  diff %= (365 * 24 * 3600);
  const months = Math.floor(diff / (30 * 24 * 3600));
  diff %= (30 * 24 * 3600);
  const days = Math.floor(diff / (24 * 3600));
  diff %= (24 * 3600);
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;

  // 确保时间文本被正确设置到DOM
  const loveDaysElement = document.getElementById("loveDays");
  if (loveDaysElement) {
    loveDaysElement.innerText =
      `我们已经在一起 ${years}年 ${months}月 ${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒 ❤️`;
  }
}

// 显示通知
function showNotification(message) {
  const notice = document.createElement('div');
  notice.textContent = message;
  notice.className = 'fixed right-6 bottom-6 bg-black text-white px-3 py-2 rounded shadow z-50';
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 1500);
}

// ========== Cloudinary + GitHub 相册功能 ==========
// 小工具
const C = {
  cloudName: 'cloudName', uploadPreset: 'uploadPreset',
  ghOwner: 'ghOwner', ghRepo: 'ghRepo', ghBranch: 'ghBranch',
  ghFile: 'ghFile', ghTokenSaved: 'ghTokenSaved'
};
const $ = s => document.querySelector(s);
const msg = t => { $('#msg').textContent = t || ''; };

function loadCfgToForm() {
  $('#cloudName').value = localStorage.getItem(C.cloudName) || 'dbqhemrnw';
  $('#uploadPreset').value = localStorage.getItem(C.uploadPreset) || 'unsigned_preset';
  $('#ghOwner').value = localStorage.getItem(C.ghOwner) || 'Qin-kings';
  $('#ghRepo').value = localStorage.getItem(C.ghRepo) || 'love';
  $('#ghBranch').value = localStorage.getItem(C.ghBranch) || 'main';
  $('#ghFile').value = localStorage.getItem(C.ghFile) || 'gallery.json';
  const t = localStorage.getItem(C.ghTokenSaved) || '';
  if (t) { $('#ghToken').value = t; $('#rememberToken').checked = true; }
}

function saveFormToCfg() {
  localStorage.setItem(C.cloudName, $('#cloudName').value.trim());
  localStorage.setItem(C.uploadPreset, $('#uploadPreset').value.trim());
  localStorage.setItem(C.ghOwner, $('#ghOwner').value.trim());
  localStorage.setItem(C.ghRepo, $('#ghRepo').value.trim());
  localStorage.setItem(C.ghBranch, $('#ghBranch').value.trim() || 'main');
  localStorage.setItem(C.ghFile, $('#ghFile').value.trim() || 'gallery.json');
  const t = $('#ghToken').value.trim();
  if ($('#rememberToken').checked && t) localStorage.setItem(C.ghTokenSaved, t);
  if (!$('#rememberToken').checked) localStorage.removeItem(C.ghTokenSaved);
  msg('设置已保存 ✅');
  showNotification('相册设置已保存 ✅');
}

function getCfg() {
  return {
    cloudName: $('#cloudName').value.trim(),
    uploadPreset: $('#uploadPreset').value.trim(),
    ghOwner: $('#ghOwner').value.trim(),
    ghRepo: $('#ghRepo').value.trim(),
    ghBranch: $('#ghBranch').value.trim() || 'main',
    ghFile: $('#ghFile').value.trim() || 'gallery.json',
    ghToken: $('#ghToken').value.trim() || localStorage.getItem(C.ghTokenSaved) || ''
  };
}

// 修改 readManifestViaAPI 函数
async function readManifestViaAPI() {
  const { ghOwner, ghRepo, ghFile, ghBranch, ghToken } = getCfg();
  const url = `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/${encodeURIComponent(ghFile)}?ref=${encodeURIComponent(ghBranch)}`;
  
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (ghToken) {
    headers['Authorization'] = `Bearer ${ghToken}`;
  }
  
  const res = await fetch(url, { headers });
  if (res.status === 404) return { list: [], sha: null };
  const j = await res.json();
  if (!res.ok) throw new Error(j.message || ('HTTP ' + res.status));
  let list = [];
  try { list = JSON.parse(atob(j.content || '')) || []; } catch (e) { list = []; }
  return { list, sha: j.sha || null };
}

// 兼容回退：直接读 raw（带时间戳避免 CDN 缓存）
async function readManifestViaRaw() {
  const { ghOwner, ghRepo, ghFile, ghBranch } = getCfg();
  const url = `https://raw.githubusercontent.com/${ghOwner}/${ghRepo}/${ghBranch}/${ghFile}?t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('raw fetch failed: ' + res.status);
  return await res.json();
}

// 修改 fetchManifest 函数，添加更好的错误处理
async function fetchManifest() {
  // 优先尝试 GitHub API（通常比 raw 更"新鲜"）
  try {
    const r = await readManifestViaAPI();
    return r; // {list, sha}
  } catch (e) {
    console.warn('GitHub API 读取失败，回退到 raw：', e);
    try {
      const list = await readManifestViaRaw();
      return { list, sha: null };
    } catch (rawError) {
      console.error('Raw fetch also failed:', rawError);
      // 如果两者都失败，返回空列表
      return { list: [], sha: null };
    }
  }
}

// 替换现有的 renderGallery 函数
async function renderGallery() {
  try {
    // 每次渲染相册时，重置选择状态
    selectedImages = [];
    updateDeleteButtonState();
    
    const { list } = await fetchManifest();
    const container = $('#gallery');
    container.innerHTML = '';

    if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500">
        <i class="fa fa-camera text-4xl mb-3"></i>
        <p>还没有照片，上传第一张照片吧！</p>
      </div>
`    ;
    return;
    }
    
    (list || []).slice().sort((a,b)=> (b.ts||0)-(a.ts||0)).forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'relative cursor-pointer group';
      div.setAttribute('data-src', item.src);
      
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || `照片 ${idx+1}`;
      img.className = 'w-full h-40 object-cover rounded-lg shadow transition-transform duration-300 group-hover:scale-105';
      img.loading = 'lazy';
      
      // 添加悬停效果
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-300 flex items-center justify-center';
      
      const eyeIcon = document.createElement('i');
      eyeIcon.className = 'fa fa-eye text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300';
      
      overlay.appendChild(eyeIcon);
      
      // 添加选择框（仅在管理模式下显示）
      const checkboxContainer = document.createElement('div');
      checkboxContainer.className = `absolute bottom-2 left-2 ${isManageMode ? '' : 'hidden'}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'image-checkbox w-5 h-5';
      checkbox.value = item.src;
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          selectedImages.push(this.value);
        } else {
          selectedImages = selectedImages.filter(src => src !== this.value);
        }
        updateDeleteButtonState();
      });
      checkboxContainer.appendChild(checkbox);
      
      div.appendChild(img);
      div.appendChild(overlay);
      div.appendChild(checkboxContainer);
      container.appendChild(div);
    });
    
    // 添加事件委托处理点击
    addGalleryClickHandlers();
    msg('');
  } catch (e) {
    console.error('renderGallery error', e);
    const container = $('#gallery');
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-red-500">
        <i class="fa fa-exclamation-triangle text-4xl mb-3"></i>
        <p>加载相册失败：${e.message || e}</p>
        <button onclick="renderGallery()" class="mt-3 px-4 py-2 bg-pink-500 text-white rounded">
          重试
        </button>
      </div>
    `;
    msg('加载相册失败：' + (e.message || e));
  }
}

// 添加事件委托处理函数
function addGalleryClickHandlers() {
 const gallery = document.getElementById('gallery');
 if (!gallery) return;
 
 // 移除旧的事件监听器（避免重复绑定）
 gallery.removeEventListener('click', handleGalleryClick);
 
 // 添加新的事件监听器
 gallery.addEventListener('click', handleGalleryClick);
}

// 处理画廊点击事件
function handleGalleryClick(e) {
 // 如果在管理模式下，不打开图片
 if (isManageMode) return;
 // 查找被点击的图片容器
 const item = e.target.closest('[data-src]');
 if (item) {
   const src = item.getAttribute('data-src');
   if (src) {
     console.log('点击图片，URL:', src);
     openImageModal(src);
   }
 }
}

// 确保在页面加载时初始化事件处理
document.addEventListener('DOMContentLoaded', () => {
 loadTableInfo();
 loadCfgToForm();
 renderGallery();
  
 // 添加管理按钮事件监听
 document.getElementById('manageGalleryBtn').addEventListener('click', toggleManageMode);
 document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedImages);
 // 添加刷新按钮事件监听
 document.getElementById('refreshGalleryBtn').addEventListener('click', renderGallery);
 // 文件选择时显示文件名
 document.getElementById('fileInput').addEventListener('change', function(e) {
   const fileName = document.getElementById('fileName');
   if (this.files.length > 0) {
     if (this.files.length === 1) {
       fileName.textContent = this.files[0].name;
     } else {
       fileName.textContent = `${this.files.length}个文件已选择`;
     }
   } else {
     fileName.textContent = "未选择任何文件";
   }
 });


 // 初始化并启动计时器更新恋爱时长
 const startDate = getLoveDate();
 calcLoveTime(); // 立即计算一次
 setInterval(calcLoveTime, 1000); // 每秒更新一次
 
 // 初始添加事件处理
 addGalleryClickHandlers();
});

 
// Cloudinary 上传
async function uploadToCloudinary(file) {
  const { cloudName, uploadPreset } = getCfg();
  if (!cloudName || !uploadPreset) throw new Error('请先填写 Cloudinary cloudName 与 unsigned preset（设置面板）');
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', uploadPreset);
  const res = await fetch(endpoint, { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    console.error('Cloudinary 返回：', data);
    throw new Error('Cloudinary 上传失败：' + (data.error?.message || res.status));
  }
  return data.secure_url;
}

// GitHub 写入 manifest（创建或更新）
async function writeManifest(list, sha, message) {
  const { ghOwner, ghRepo, ghFile, ghBranch, ghToken } = getCfg();
  if (!ghToken) throw new Error('请在设置里输入 GitHub Token（仅本机）');
  const apiUrl = `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/${encodeURIComponent(ghFile)}`;

  const body = {
    message: message || 'update gallery',
    content: btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2)))),
    branch: ghBranch
  };
  if (sha) body.sha = sha; // 更新已有文件
  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${ghToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('writeManifest error', res.status, text);
    throw new Error('写入 gallery.json 失败：' + text);
  }
  return JSON.parse(text);
}

// 写入后等待生效（轮询检测最新 manifest 包含新 URL）
async function waitForManifestToContain(expectedUrls, {attempts=8, delayMs=900} = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const { list } = await fetchManifest();
      const srcs = (list || []).map(it => it.src);
      const allPresent = expectedUrls.every(u => srcs.includes(u));
      if (allPresent) return true;
    } catch (e) {
      // ignore and retry
      console.warn('waitForManifest .. fetch failed', e);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

// 上传入口：Cloudinary -> 写 GitHub -> 等待生效 -> 刷新
async function startUpload() {
  if (!checkRequiredSettings()) return;
  try {
    msg('上传中…');
    const files = Array.from($('#fileInput').files || []);
    if (files.length === 0) { msg('请选择图片'); return; }

    // 读取当前 manifest（可能为空）
    const { list, sha } = await fetchManifest();
    const addedUrls = [];

    // 逐个上传 Cloudinary
    for (const f of files) {
      const url = await uploadToCloudinary(f);
      const item = { src: url, alt: f.name, who: '我们', ts: Date.now() };
      list.push(item);
      addedUrls.push(url);
    }

    // 写回 GitHub
    await writeManifest(list, sha, `add ${files.length} photo(s)`);

    // 等待 manifest 生效（短轮询）
    msg('写入成功，等待 GitHub 内容生效（可能需几秒）…');
    const ok = await waitForManifestToContain(addedUrls, { attempts: 10, delayMs: 900 });
    if (!ok) {
      msg('写入成功，但未在短时间内检测到更新（可能 CDN 延迟）。稍等片刻或手动刷新。');
    } else {
      msg('更新已生效，刷新相册中…');
    }

    // 最后刷新显示
    await renderGallery();
    $('#fileInput').value = '';
    msg('上传完成 ✅');
    showNotification('照片上传完成 ✅');
  } catch (e) {
    console.error('startUpload error', e);
    alert('上传失败：' + (e.message || e));
    msg('上传失败：' + (e.message || e));
    showNotification('上传失败：' + (e.message || e));
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  loadTableInfo();
  loadCfgToForm();
  renderGallery();
  // 文件选择时显示文件名
  document.getElementById('fileInput').addEventListener('change', function(e) {
    const fileName = document.getElementById('fileName');
    if (this.files.length > 0) {
      if (this.files.length === 1) {
        fileName.textContent = this.files[0].name;
      } else {
        fileName.textContent = `${this.files.length}个文件已选择`;
      }
    } else {
      fileName.textContent = "未选择任何文件";
    }
  });
   
  // 初始化并启动计时器更新恋爱时长
  const startDate = getLoveDate();
  calcLoveTime(); // 立即计算一次
  setInterval(calcLoveTime, 1000); // 每秒更新一次
});

// 事件绑定
$('#uploadBtn').addEventListener('click', startUpload);
$('#clearTokenBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem(C.ghTokenSaved);
  $('#ghToken').value = '';
  $('#rememberToken').checked = false;
  msg('已清除本机保存的 Token');
  showNotification('已清除本机保存的 Token');
});
// 设置浮层相关函数
function openSettingsModal() {
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.add('hidden');
}

// 事件监听
document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
document.getElementById('modalSaveCfgBtn').addEventListener('click', saveFormToCfg);
document.getElementById('refreshGalleryBtn').addEventListener('click', renderGallery);

// 图片放大功能
function openImageModal(src) {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
 
  console.log('打开图片模态框，尝试加载图片:', src);
 
  // 确保URL有效
  if (!src || typeof src !== 'string') {
    console.error('无效的图片URL:', src);
    return;
  }
 
  // 添加加载事件监听器
  modalImage.onload = function() {
    console.log('图片加载成功');
  };
 
  modalImage.onerror = function() {
    console.error('图片加载失败，URL:', src);
    // 可以设置一个默认错误图片
    modalImage.alt = '图片加载失败';
  };
 
  modalImage.src = src;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // 防止背景滚动
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.add('hidden');
  document.body.style.overflow = ''; // 恢复背景滚动
}

// 点击模态框背景关闭
document.getElementById('imageModal').addEventListener('click', (e) => {
  if (e.target.id === 'imageModal') {
    closeImageModal();
  }
});

// ESC键关闭
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('imageModal').classList.contains('hidden')) {
    closeImageModal();
  }
});

// 切换管理模式
// 修改 toggleManageMode 函数
function toggleManageMode() {
  isManageMode = !isManageMode;
  
  const manageBtn = document.getElementById('manageGalleryBtn');
  const deleteContainer = document.getElementById('deleteSelectedContainer');
  
  if (isManageMode) {
    manageBtn.innerHTML = '<i class="fa fa-times"></i> 取消管理';
    manageBtn.classList.remove('bg-blue-500');
    manageBtn.classList.add('bg-gray-500');
    deleteContainer.classList.remove('hidden');
  } else {
    manageBtn.innerHTML = '<i class="fa fa-cog"></i> 管理';
    manageBtn.classList.remove('bg-gray-500');
    manageBtn.classList.add('bg-blue-500');
    deleteContainer.classList.add('hidden');
    
    // 退出管理模式时，清除所有选择状态
    selectedImages = [];
    
    // 取消所有选择框的选中状态
    document.querySelectorAll('.image-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // 更新删除按钮状态
    updateDeleteButtonState();
  }
  
  // 显示/隐藏所有选择框
  document.querySelectorAll('.image-checkbox').forEach(checkbox => {
    checkbox.parentElement.classList.toggle('hidden', !isManageMode);
  });
}

// 更新删除按钮状态
// 修改 updateDeleteButtonState 函数
function updateDeleteButtonState() {
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  if (selectedImages.length > 0) {
    deleteBtn.disabled = false;
    deleteBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
    deleteBtn.classList.add('bg-red-500', 'hover:bg-red-600');
    deleteBtn.innerHTML = `<i class="fa fa-trash"></i> 删除选中 (${selectedImages.length})`;
  } else {
    deleteBtn.disabled = true;
    deleteBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
    deleteBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
    deleteBtn.innerHTML = '<i class="fa fa-trash"></i> 删除选中';
  }
}

// 删除选中的图片
// 修改 deleteSelectedImages 函数
async function deleteSelectedImages() {
  if (selectedImages.length === 0) return;
  
  if (!confirm(`确定要删除选中的 ${selectedImages.length} 张照片吗？此操作不可撤销。`)) {
    return;
  }
  
  try {
    msg('删除中...');
    
    // 获取当前manifest
    const { list, sha } = await fetchManifest();
    
    // 从列表中移除选中的图片
    const updatedList = list.filter(item => !selectedImages.includes(item.src));
    
    // 写回 GitHub
    await writeManifest(updatedList, sha, `删除 ${selectedImages.length} 张照片`);
    
    msg('删除成功，等待更新生效...');
    
    // 等待manifest生效
    const ok = await waitForManifestToNotContain(selectedImages, { attempts: 10, delayMs: 900 });
    
    if (!ok) {
      msg('删除成功，但未在短时间内检测到更新（可能 CDN 延迟）。稍等片刻或手动刷新。');
    } else {
      msg('更新已生效，刷新相册中...');
    }
    
    // 退出管理模式并刷新相册
    isManageMode = false;
    selectedImages = [];
    
    // 更新按钮状态
    document.getElementById('manageGalleryBtn').innerHTML = '<i class="fa fa-cog"></i> 管理';
    document.getElementById('manageGalleryBtn').classList.remove('bg-gray-500');
    document.getElementById('manageGalleryBtn').classList.add('bg-blue-500');
    document.getElementById('deleteSelectedContainer').classList.add('hidden');
    
    await renderGallery();
    msg('照片已删除 ✅');
    showNotification(`已删除 ${selectedImages.length} 张照片 ✅`);
  } catch (e) {
    console.error('deleteSelectedImages error', e);
    alert('删除失败：' + (e.message || e));
    msg('删除失败：' + (e.message || e));
    showNotification('删除失败：' + (e.message || e));
  }
}

// 添加等待manifest不包含特定URL的函数
async function waitForManifestToNotContain(unwantedUrls, {attempts=8, delayMs=900} = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const { list } = await fetchManifest();
      const srcs = (list || []).map(it => it.src);
      const nonePresent = unwantedUrls.every(u => !srcs.includes(u));
      if (nonePresent) return true;
    } catch (e) {
      console.warn('waitForManifestToNotContain fetch failed', e);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

// 添加一个函数来检查必要的设置
function checkRequiredSettings() {
  const { cloudName, uploadPreset, ghOwner, ghRepo, ghToken } = getCfg();
  const errors = [];
  
  if (!cloudName) errors.push('Cloudinary Cloud Name');
  if (!uploadPreset) errors.push('Cloudinary Upload Preset');
  if (!ghOwner) errors.push('GitHub Owner');
  if (!ghRepo) errors.push('GitHub Repo');
  if (!ghToken) errors.push('GitHub Token');
  
  if (errors.length > 0) {
    alert(`请先完成以下设置：\n${errors.join('\n')}\n\n点击右上角的设置按钮进行配置。`);
    openSettingsModal();
    return false;
  }
  
  return true;
}
