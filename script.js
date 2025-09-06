// ========== 全局变量和配置 ==========
let isManageMode = false;
let selectedImages = [];
let currentAvatarId = null;
let galleryItems = []; // 存储相册项的本地副本
let currentPage = 1;
const ITEMS_PER_PAGE = 12; // 每页显示12张图片

// 默认头像路径
const defaultAvatars = {
    avatar1: "images/qinbaotai.png",
    avatar2: "images/yanxuran.png"
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

// ========== 初始化函数 ==========
document.addEventListener('DOMContentLoaded', () => {
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
        if (saved) {
            document.getElementById(id).src = saved;
        } else {
            document.getElementById(id).src = defaultAvatars[id];
        }
    });

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
    // 创建表格行的代码
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

    const defaultInfo = fallbackPersonalInfo;
    defaultInfo.forEach(r => tbody.appendChild(createInfoRow(r.project, r.ta, r.me)));
}

// ========== 相爱时长功能 ==========
function initLoveTime() {
    const startDate = getLoveDate();
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

// ========== 相册功能 - 优化版本 ==========
function initGallery() {
    // 初始化时先显示骨架屏
    renderSkeletonLoader();
    // 然后加载实际图片
    loadGalleryData();
}

function initEventListeners() {
    // 管理按钮
    document.getElementById('manageGalleryBtn').addEventListener('click', toggleManageMode);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedImages);
    
    // 刷新按钮
    document.getElementById('refreshGalleryBtn').addEventListener('click', () => {
        currentPage = 1;
        loadGalleryData();
    });
    
    // 文件选择
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const fileName = document.getElementById('fileName');
        if (this.files.length > 0) {
            fileName.textContent = this.files.length === 1 
                ? this.files[0].name 
                : `${this.files.length}个文件已选择`;
        } else {
            fileName.textContent = "未选择任何文件";
        }
    });
    
    // 上传按钮
    document.getElementById('uploadBtn').addEventListener('click', startUpload);
    
    // 加载更多按钮
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreImages);
}

// 渲染骨架屏
function renderSkeletonLoader() {
    const container = $('#gallery');
    container.innerHTML = '';
    
    for (let i = 0; i < ITEMS_PER_PAGE; i++) {
        const div = document.createElement('div');
        div.className = 'relative';
        
        const skeleton = document.createElement('div');
        skeleton.className = 'w-full h-40 rounded-lg skeleton';
        
        div.appendChild(skeleton);
        container.appendChild(div);
    }
}

// 加载相册数据
async function loadGalleryData() {
    try {
        const { list } = await fetchManifest();
        galleryItems = list || [];
        
        // 重置分页
        currentPage = 1;
        
        // 渲染第一页
        renderGalleryPage();
        
        // 如果有更多图片，显示加载更多按钮
        toggleLoadMoreButton();
        
    } catch (e) {
        console.error('加载相册数据失败:', e);
        $('#gallery').innerHTML = `
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

// 渲染当前页的图片
function renderGalleryPage() {
    const container = $('#gallery');
    
    // 如果是第一页，清空容器
    if (currentPage === 1) {
        container.innerHTML = '';
    }
    
    // 计算当前页的图片范围
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, galleryItems.length);
    const currentItems = galleryItems.slice(startIndex, endIndex);
    
    if (currentItems.length === 0 && currentPage === 1) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <i class="fa fa-camera text-4xl mb-3"></i>
                <p>还没有照片，上传第一张照片吧！</p>
            </div>
        `;
        return;
    }
    
    // 渲染当前页的图片
    currentItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'relative cursor-pointer group gallery-item';
        div.setAttribute('data-src', item.src);
        
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || `照片 ${idx+1}`;
        img.className = 'w-full h-40 object-cover rounded-lg shadow';
        img.loading = 'lazy'; // 懒加载
        
        // 添加加载完成后的淡入效果
        img.onload = function() {
            this.classList.add('opacity-100');
            this.classList.remove('opacity-0');
        };
        img.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        
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

// 加载更多图片
function loadMoreImages() {
    currentPage++;
    renderGalleryPage();
    toggleLoadMoreButton();
}

// 显示/隐藏加载更多按钮
function toggleLoadMoreButton() {
    const loadMoreContainer = $('#loadMoreContainer');
    const totalPages = Math.ceil(galleryItems.length / ITEMS_PER_PAGE);
    
    if (currentPage < totalPages) {
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
}

// 添加图片点击事件处理
function addGalleryClickHandlers() {
    const gallery = $('#gallery');
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
    
    const files = Array.from($('#fileInput').files || []);
    if (files.length === 0) {
        showNotification('请选择图片');
        return;
    }
    
    try {
        // 显示上传进度
        const progressContainer = $('#uploadProgressContainer');
        const progressBar = $('#uploadProgressBar');
        const progressText = $('#uploadProgressText');
        
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        // 读取当前manifest
        const { list, sha } = await fetchManifest();
        const addedUrls = [];
        
        // 逐个上传文件
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // 更新进度
            const progress = Math.round((i / files.length) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            const url = await uploadToCloudinary(file);
            const item = { src: url, alt: file.name, who: '我们', ts: Date.now() };
            list.push(item);
            addedUrls.push(url);
            
            // 立即添加到本地相册
            galleryItems.unshift(item);
        }
        
        // 完成进度
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        
        // 立即更新本地显示
        currentPage = 1;
        renderGalleryPage();
        toggleLoadMoreButton();
        
        // 异步写回 GitHub
        setTimeout(async () => {
            try {
                await writeManifest(list, sha, `add ${files.length} photo(s)`);
                showNotification('照片上传完成 ✅');
            } catch (e) {
                console.error('写入GitHub失败:', e);
                showNotification('上传完成但同步到GitHub失败');
            } finally {
                // 隐藏进度条
                progressContainer.classList.add('hidden');
                $('#fileInput').value = '';
                $('#fileName').textContent = "未选择任何文件";
            }
        }, 500);
        
    } catch (e) {
        console.error('上传失败:', e);
        showNotification('上传失败: ' + (e.message || e));
        $('#uploadProgressContainer').classList.add('hidden');
    }
}

// 删除选中图片
async function deleteSelectedImages() {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedImages.length} 张照片吗？此操作不可撤销。`)) {
        return;
    }
    
    try {
        // 立即从本地相册中移除
        galleryItems = galleryItems.filter(item => !selectedImages.includes(item.src));
        
        // 立即更新显示
        currentPage = 1;
        renderGalleryPage();
        toggleLoadMoreButton();
        
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
    
    const manageBtn = $('#manageGalleryBtn');
    const deleteContainer = $('#deleteSelectedContainer');
    
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
        
        // 清除选择状态
        selectedImages = [];
        document.querySelectorAll('.image-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateDeleteButtonState();
    }
    
    // 显示/隐藏所有选择框
    document.querySelectorAll('.image-checkbox').forEach(checkbox => {
        checkbox.parentElement.classList.toggle('hidden', !isManageMode);
    });
}

// 更新删除按钮状态
function updateDeleteButtonState() {
    const deleteBtn = $('#deleteSelectedBtn');
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
    document.getElementById(modalId).classList.remove("hidden");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
    if (modalId === 'avatarModal') {
        currentAvatarId = null;
        document.getElementById("avatarFileInput").value = "";
    }
}

function resetAvatar() {
    if (currentAvatarId) {
        localStorage.removeItem(currentAvatarId);
        document.getElementById(currentAvatarId).src = defaultAvatars[currentAvatarId];
    }
    closeModal('avatarModal');
}

function showNotification(message) {
    const notice = document.createElement('div');
    notice.textContent = message;
    notice.className = 'fixed right-6 bottom-6 bg-black text-white px-3 py-2 rounded shadow z-50';
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 1500);
}

function openImageModal(src) {
    const modal = $('#imageModal');
    const modalImage = $('#modalImage');
    
    modalImage.src = src;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = $('#imageModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Cloudinary 和 GitHub 相关函数
async function fetchManifest() {
    // 实现从GitHub获取manifest的逻辑
    return { list: [], sha: null };
}

async function uploadToCloudinary(file) {
    // 实现上传到Cloudinary的逻辑
    return "https://example.com/image.jpg";
}

async function writeManifest(list, sha, message) {
    // 实现写入GitHub的逻辑
}

function checkRequiredSettings() {
    // 检查必要设置的逻辑
    return true;
}
