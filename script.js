// ========== 全局变量和配置 ==========
let isManageMode = false;
let selectedImages = [];
let currentAvatarId = null;
let galleryItems = []; // 存储相册项的本地副本

// 默认头像路径 - 使用占位图
const defaultAvatars = {
    avatar1: "https://via.placeholder.com/100?text=老公",
    avatar2: "https://via.placeholder.com/100?text=老婆"
};

// 默认恋爱起始时间
const DEFAULT_LOVE_DATE = "2024-02-26T00:00:00+08:00";
let originalLoveDate = "";

// Cloudinary + GitHub 配置
const C = {
    cloudName: 'cloudName', uploadPreset: 'uploadPreset',
    ghOwner: 'ghOwner', ghRepo: 'ghRepo', ghBranch: 'ghBranch',
    ghFile: 'ghFile', ghTokenSaved: 'ghTokenSaved'
};

// DOM 查询快捷方式
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ========== 初始化函数 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 初始化各个模块
    initAvatar();
    initPersonalInfo();
    initLoveTime();
    initGallery();
    initEventListeners();
    
    // 启动计时器更新恋爱时长
    calcLoveTime();
    setInterval(calcLoveTime, 1000);
});

// ========== 头像功能 ==========
function initAvatar() {
    ['avatar1','avatar2'].forEach(id => {
        const saved = localStorage.getItem(id);
        const avatarElement = document.getElementById(id);
        if (avatarElement) {
            if (saved) {
                avatarElement.src = saved;
            } else {
                avatarElement.src = defaultAvatars[id];
            }
        }
    });

    const avatarFileInput = document.getElementById("avatarFileInput");
    if (avatarFileInput) {
        avatarFileInput.addEventListener("change", function (event) {
            if (event.target.files && event.target.files[0] && currentAvatarId) {
                let reader = new FileReader();
                reader.onload = function (e) {
                    const avatarElement = document.getElementById(currentAvatarId);
                    if (avatarElement) {
                        avatarElement.src = e.target.result;
                    }
                    localStorage.setItem(currentAvatarId, e.target.result);
                };
                reader.readAsDataURL(event.target.files[0]);
            }
        });
    }
}

// ========== 个人信息功能 ==========
function initPersonalInfo() {
    loadTableInfo();
}

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
    if (tbody) {
        tbody.appendChild(createInfoRow());
    }
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
    if (!tbody) return;
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

    fallbackPersonalInfo.forEach(r => tbody.appendChild(createInfoRow(r.project, r.ta, r.me)));
}

// ========== 相爱时长功能 ==========
function initLoveTime() {
    calcLoveTime();
}

function getLoveDate() {
    return localStorage.getItem("loveDate") || DEFAULT_LOVE_DATE;
}

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

    const loveDaysElement = document.getElementById("loveDays");
    if (loveDaysElement) {
        loveDaysElement.innerText =
            `我们已经在一起 ${years}年 ${months}月 ${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒 ❤️`;
    }
}

// ========== 相册功能 ==========
function initGallery() {
    loadGalleryData();
}

function initEventListeners() {
    // 管理按钮
    const manageGalleryBtn = document.getElementById('manageGalleryBtn');
    if (manageGalleryBtn) {
        manageGalleryBtn.addEventListener('click', toggleManageMode);
    }
    
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelectedImages);
    }
    
    // 刷新按钮
    const refreshGalleryBtn = document.getElementById('refreshGalleryBtn');
    if (refreshGalleryBtn) {
        refreshGalleryBtn.addEventListener('click', () => {
            loadGalleryData();
        });
    }
    
    // 文件选择
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileName = document.getElementById('fileName');
            if (fileName) {
                if (this.files.length > 0) {
                    fileName.textContent = this.files.length === 1 
                        ? this.files[0].name 
                        : `${this.files.length}个文件已选择`;
                } else {
                    fileName.textContent = "未选择任何文件";
                }
            }
        });
    }
    
    // 上传按钮
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', startUpload);
    }
    
    // 设置按钮
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }
    
    // 保存设置按钮
    const modalSaveCfgBtn = document.getElementById('modalSaveCfgBtn');
    if (modalSaveCfgBtn) {
        modalSaveCfgBtn.addEventListener('click', saveFormToCfg);
    }
    
    // 清除Token按钮
    const clearTokenBtn = document.getElementById('clearTokenBtn');
    if (clearTokenBtn) {
        clearTokenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem(C.ghTokenSaved);
            const ghTokenInput = document.getElementById('ghToken');
            if (ghTokenInput) ghTokenInput.value = '';
            const rememberTokenCheckbox = document.getElementById('rememberToken');
            if (rememberTokenCheckbox) rememberTokenCheckbox.checked = false;
            showNotification('已清除本机保存的 Token');
        });
    }
}

// 加载相册数据
async function loadGalleryData() {
    try {
        const { list } = await fetchManifest();
        galleryItems = list || [];
        renderGallery();
    } catch (e) {
        console.error('加载相册数据失败:', e);
        const container = document.getElementById('gallery');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8 text-red-500">
                    <i class="fa fa-exclamation-triangle text-4xl mb-3"></i>
                    <p>加载相册失败：${e.message || e}</p>
                    <button onclick="loadGalleryData()" class="mt-3 px-4 py-2 bg-pink-500 text-white rounded">
                        重试
                    </button>
                </div>
            `;
        }
    }
}

// 渲染相册
function renderGallery() {
    const container = document.getElementById('gallery');
    if (!container) return;
    
    // 重置选择状态
    selectedImages = [];
    updateDeleteButtonState();
    
    container.innerHTML = '';

    if (!galleryItems || galleryItems.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <i class="fa fa-camera text-4xl mb-3"></i>
                <p>还没有照片，上传第一张照片吧！</p>
            </div>
        `;
        return;
    }
    
    galleryItems.slice().sort((a,b) => (b.ts||0) - (a.ts||0)).forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'relative cursor-pointer group gallery-item';
        div.setAttribute('data-src', item.src);
        
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || `照片 ${idx+1}`;
        img.className = 'w-full h-40 object-cover rounded-lg shadow';
        img.loading = 'lazy'; // 懒加载
        
        // 添加悬停效果
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-300 flex items-center justify-center';
        
        const eyeIcon = document.createElement('i');
        eyeIcon.className = 'fa fa-eye text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300';
        
        overlay.appendChild(eyeIcon);
        
        // 添加选择框（仅在管理模式下显示）
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = `absolute top-2 left-2 ${isManageMode ? '' : 'hidden'}`;
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
    
    // 添加点击事件处理
    addGalleryClickHandlers();
}

// 添加图片点击事件处理
function addGalleryClickHandlers() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.removeEventListener('click', handleGalleryClick);
    gallery.addEventListener('click', handleGalleryClick);
}

function handleGalleryClick(e) {
    if (isManageMode) return;
    
    const item = e.target.closest('[data-src]');
    if (item) {
        const src = item.getAttribute('data-src');
        if (src) {
            openImageModal(src);
        }
    }
}

// 图片上传功能
async function startUpload() {
    if (!checkRequiredSettings()) return;
    
    const files = Array.from(document.getElementById('fileInput').files || []);
    if (files.length === 0) {
        showNotification('请选择图片');
        return;
    }
    
    try {
        showNotification('上传中…');
        
        // 读取当前manifest
        const { list, sha } = await fetchManifest();
        const addedUrls = [];
        
        // 逐个上传文件
        for (const f of files) {
            const url = await uploadToCloudinary(f);
            const item = { src: url, alt: f.name, who: '我们', ts: Date.now() };
            list.push(item);
            addedUrls.push(url);
            
            // 立即添加到本地相册
            galleryItems.unshift(item);
        }
        
        // 立即更新显示
        renderGallery();
        
        // 异步写回 GitHub
        setTimeout(async () => {
            try {
                await writeManifest(list, sha, `add ${files.length} photo(s)`);
                showNotification('照片上传完成 ✅');
            } catch (e) {
                console.error('写入GitHub失败:', e);
                showNotification('上传完成但同步到GitHub失败');
            } finally {
                // 清空文件选择
                const fileInput = document.getElementById('fileInput');
                if (fileInput) fileInput.value = '';
                const fileName = document.getElementById('fileName');
                if (fileName) fileName.textContent = "未选择任何文件";
            }
        }, 500);
        
    } catch (e) {
        console.error('上传失败:', e);
        showNotification('上传失败: ' + (e.message || e));
    }
}

// 删除选中图片
async function deleteSelectedImages() {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedImages.length} 张照片吗？此操作不可撤销。`)) {
        return;
    }
    
    try {
        showNotification('删除中...');
        
        // 立即从本地相册中移除
        galleryItems = galleryItems.filter(item => !selectedImages.includes(item.src));
        
        // 立即更新显示
        renderGallery();
        
        // 退出管理模式
        toggleManageMode();
        
        // 异步更新GitHub
        setTimeout(async () => {
            try {
                const { list, sha } = await fetchManifest();
                const updatedList = list.filter(item => !selectedImages.includes(item.src));
                await writeManifest(updatedList, sha, `删除 ${selectedImages.length} 张照片`);
                showNotification(`已删除 ${selectedImages.length} 张照片 ✅`);
            } catch (e) {
                console.error('删除失败:', e);
                showNotification('删除失败: ' + (e.message || e));
            }
        }, 500);
        
    } catch (e) {
        console.error('删除失败:', e);
        showNotification('删除失败: ' + (e.message || e));
    }
}

// 切换管理模式
function toggleManageMode() {
    isManageMode = !isManageMode;
    
    const manageBtn = document.getElementById('manageGalleryBtn');
    const deleteContainer = document.getElementById('deleteSelectedContainer');
    
    if (manageBtn) {
        if (isManageMode) {
            manageBtn.innerHTML = '<i class="fa fa-times"></i> 取消管理';
            manageBtn.classList.remove('bg-blue-500');
            manageBtn.classList.add('bg-gray-500');
        } else {
            manageBtn.innerHTML = '<i class="fa fa-cog"></i> 管理';
            manageBtn.classList.remove('bg-gray-500');
            manageBtn.classList.add('bg-blue-500');
        }
    }
    
    if (deleteContainer) {
        if (isManageMode) {
            deleteContainer.classList.remove('hidden');
        } else {
            deleteContainer.classList.add('hidden');
        }
    }
    
    // 退出管理模式时，清除所有选择状态
    if (!isManageMode) {
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
        if (checkbox.parentElement) {
            checkbox.parentElement.classList.toggle('hidden', !isManageMode);
        }
    });
}

// 更新删除按钮状态
function updateDeleteButtonState() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (!deleteBtn) return;
    
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

// ========== 辅助函数 ==========
function openModal(modalId, avatarId = null) {
    if (modalId === 'avatarModal' && avatarId) {
        currentAvatarId = avatarId;
    }
    if (modalId === 'loveDateModal') {
        // 保存原始值
        originalLoveDate = getLoveDate().substring(0, 10);
        const loveDateInput = document.getElementById('loveDateInModal');
        if (loveDateInput) {
            loveDateInput.value = originalLoveDate;
        }
    }
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("hidden");
    }
}

function closeModal(modalId) {
    if (modalId === 'loveDateModal') {
        // 恢复原始值
        const loveDateInput = document.getElementById('loveDateInModal');
        if (loveDateInput) {
            loveDateInput.value = originalLoveDate;
        }
    }
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("hidden");
    }
    if (modalId === 'avatarModal') {
        currentAvatarId = null;
        const avatarFileInput = document.getElementById("avatarFileInput");
        if (avatarFileInput) {
            avatarFileInput.value = "";
        }
    }
}

function resetAvatar() {
    if (currentAvatarId) {
        localStorage.removeItem(currentAvatarId);
        const avatarElement = document.getElementById(currentAvatarId);
        if (avatarElement) {
            avatarElement.src = defaultAvatars[currentAvatarId];
        }
    }
    closeModal('avatarModal');
}

function resetLoveDateInput() {
    const loveDateInput = document.getElementById('loveDateInModal');
    if (loveDateInput) {
        loveDateInput.value = DEFAULT_LOVE_DATE.substring(0, 10);
    }
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

function showNotification(message) {
    const notice = document.createElement('div');
    notice.textContent = message;
    notice.className = 'fixed right-6 bottom-6 bg-black text-white px-3 py-2 rounded shadow z-50';
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 1500);
}

function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    // 确保URL有效
    if (!src || typeof src !== 'string') {
        console.error('无效的图片URL:', src);
        return;
    }
    
    if (modalImage) {
        modalImage.src = src;
    }
    
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function openSettingsModal() {
    loadCfgToForm();
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.remove('hidden');
    }
}

function closeSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
}

function loadCfgToForm() {
    // 确保元素存在再设置值
    const cloudNameInput = document.getElementById('cloudName');
    if (cloudNameInput) cloudNameInput.value = localStorage.getItem(C.cloudName) || 'dbqhemrnw';
    
    const uploadPresetInput = document.getElementById('uploadPreset');
    if (uploadPresetInput) uploadPresetInput.value = localStorage.getItem(C.uploadPreset) || 'unsigned_preset';
    
    const ghOwnerInput = document.getElementById('ghOwner');
    if (ghOwnerInput) ghOwnerInput.value = localStorage.getItem(C.ghOwner) || 'Qin-kings';
    
    const ghRepoInput = document.getElementById('ghRepo');
    if (ghRepoInput) ghRepoInput.value = localStorage.getItem(C.ghRepo) || 'love';
    
    const ghBranchInput = document.getElementById('ghBranch');
    if (ghBranchInput) ghBranchInput.value = localStorage.getItem(C.ghBranch) || 'main';
    
    const ghFileInput = document.getElementById('ghFile');
    if (ghFileInput) ghFileInput.value = localStorage.getItem(C.ghFile) || 'gallery.json';
    
    const t = localStorage.getItem(C.ghTokenSaved) || '';
    const ghTokenInput = document.getElementById('ghToken');
    if (ghTokenInput) {
        ghTokenInput.value = t;
    }
    const rememberTokenCheckbox = document.getElementById('rememberToken');
    if (rememberTokenCheckbox) {
        rememberTokenCheckbox.checked = !!t;
    }
}

function saveFormToCfg() {
    const cloudNameInput = document.getElementById('cloudName');
    if (cloudNameInput) localStorage.setItem(C.cloudName, cloudNameInput.value.trim());
    
    const uploadPresetInput = document.getElementById('uploadPreset');
    if (uploadPresetInput) localStorage.setItem(C.uploadPreset, uploadPresetInput.value.trim());
    
    const ghOwnerInput = document.getElementById('ghOwner');
    if (ghOwnerInput) localStorage.setItem(C.ghOwner, ghOwnerInput.value.trim());
    
    const ghRepoInput = document.getElementById('ghRepo');
    if (ghRepoInput) localStorage.setItem(C.ghRepo, ghRepoInput.value.trim());
    
    const ghBranchInput = document.getElementById('ghBranch');
    if (ghBranchInput) localStorage.setItem(C.ghBranch, ghBranchInput.value.trim() || 'main');
    
    const ghFileInput = document.getElementById('ghFile');
    if (ghFileInput) localStorage.setItem(C.ghFile, ghFileInput.value.trim() || 'gallery.json');
    
    const ghTokenInput = document.getElementById('ghToken');
    const rememberTokenCheckbox = document.getElementById('rememberToken');
    const t = ghTokenInput ? ghTokenInput.value.trim() : '';
    if (rememberTokenCheckbox && rememberTokenCheckbox.checked && t) {
        localStorage.setItem(C.ghTokenSaved, t);
    }
    if (rememberTokenCheckbox && !rememberTokenCheckbox.checked) {
        localStorage.removeItem(C.ghTokenSaved);
    }
    showNotification('相册设置已保存 ✅');
}

function getCfg() {
    const cloudNameInput = document.getElementById('cloudName');
    const uploadPresetInput = document.getElementById('uploadPreset');
    const ghOwnerInput = document.getElementById('ghOwner');
    const ghRepoInput = document.getElementById('ghRepo');
    const ghBranchInput = document.getElementById('ghBranch');
    const ghFileInput = document.getElementById('ghFile');
    const ghTokenInput = document.getElementById('ghToken');
    
    return {
        cloudName: cloudNameInput ? cloudNameInput.value.trim() : '',
        uploadPreset: uploadPresetInput ? uploadPresetInput.value.trim() : '',
        ghOwner: ghOwnerInput ? ghOwnerInput.value.trim() : '',
        ghRepo: ghRepoInput ? ghRepoInput.value.trim() : '',
        ghBranch: ghBranchInput ? ghBranchInput.value.trim() || 'main' : 'main',
        ghFile: ghFileInput ? ghFileInput.value.trim() || 'gallery.json' : 'gallery.json',
        ghToken: ghTokenInput ? ghTokenInput.value.trim() : localStorage.getItem(C.ghTokenSaved) || ''
    };
}

// Cloudinary 和 GitHub 相关函数
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

async function readManifestViaRaw() {
    const { ghOwner, ghRepo, ghFile, ghBranch } = getCfg();
    const url = `https://raw.githubusercontent.com/${ghOwner}/${ghRepo}/${ghBranch}/${ghFile}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('raw fetch failed: ' + res.status);
    return await res.json();
}

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

// ESC键关闭图片模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const imageModal = document.getElementById('imageModal');
        if (imageModal && !imageModal.classList.contains('hidden')) {
            closeImageModal();
        }
        
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            closeSettingsModal();
        }
    }
});

// 点击模态框背景关闭
const imageModal = document.getElementById('imageModal');
if (imageModal) {
    imageModal.addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') {
            closeImageModal();
        }
    });
}

const settingsModal = document.getElementById('settingsModal');
if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            closeSettingsModal();
        }
    });
}
