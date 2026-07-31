// 1. Lấy các phần tử DOM
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const textInput = document.getElementById('textInput');
const textColorInput = document.getElementById('textColor');
const fontSizeInput = document.getElementById('fontSize');
// Thêm dòng này vào phần 1 (Lấy các phần tử DOM)
const fontFamilyInput = document.getElementById('fontFamily');
const textDirectionInputs = document.querySelectorAll('input[name="textDirection"]');
const strokeColorInput = document.getElementById('strokeColor');
const strokeWidthInput = document.getElementById('strokeWidth');

// 2. Trạng thái toàn cục (STATE)

// Trạng thái ảnh nền
let backgroundImage = null;
let stickers = [];
let selectedStickerIndex = -1; // Biến mới: Nhớ xem sticker nào đang được click chọn (-1 là không chọn gì)
const handleSize = 12; // Kích thước của ô vuông dùng để kéo giãn

// Trạng thái của đoạn chữ
let textState = {
    content: "KIM NGÂN",
    x: 50,
    y: 100,
    color: "#ffffff",
    fontSize: "60",
    fontFamily: fontFamilyInput.value, // <--- Cập nhật dòng này
    direction: "horizontal", // Thêm dòng này: Mặc định là nằm ngang
    strokeColor: "#000000", // Màu viền mặc định
    strokeWidth: 4,         // Độ dày viền mặc định
    width: 0,
    height: 0
};

// Trạng thái của hành động kéo thả
let draggingState = {
    isDragging: false,
    target: null, // Sẽ là 'text', 'sticker', hoặc 'resize-sticker'
    stickerIndex: -1, 
    startX: 0,
    startY: 0
};


// 3. Hàm cốt lõi: Vẽ lại toàn bộ Canvas
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Vẽ nền
    if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0);

    // 2. Vẽ tất cả sticker trong mảng
    stickers.forEach((st, index) => {
        ctx.drawImage(st.image, st.x, st.y, st.width, st.height);

        // NẾU sticker này đang được click chọn, ta sẽ vẽ khung viền cho nó
        if (index === selectedStickerIndex) {
            // Vẽ viền đứt nét màu xanh dương
            ctx.strokeStyle = '#3498db'; 
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Tạo nét đứt
            ctx.strokeRect(st.x, st.y, st.width, st.height);
            ctx.setLineDash([]); // Trả lại nét liền kẻo ảnh hưởng tới các viền khác

            // Vẽ ô vuông nhỏ ở góc Dưới - Phải để làm nút kéo giãn
            ctx.fillStyle = '#3498db';
            ctx.fillRect(
                st.x + st.width - handleSize / 2, 
                st.y + st.height - handleSize / 2, 
                handleSize, 
                handleSize
            );
        }
    });

    // 3. Vẽ chữ (lên trên cùng)
    drawText();
}

// Hàm phụ để vẽ chữ (Đã nâng cấp có Viền)
function drawText() {
    if (!textState.content) return;

    // Cài đặt phông chữ và căn lề
    ctx.font = `${textState.fontSize}px ${textState.fontFamily}`;
    ctx.textBaseline = "top"; 
    
    // Cài đặt phong cách tô màu và vẽ viền
    ctx.fillStyle = textState.color;
    ctx.strokeStyle = textState.strokeColor;
    ctx.lineWidth = textState.strokeWidth;
    
    // Bí quyết "ăn tiền": Làm tròn góc viền chữ để không bị sắc nhọn gai góc
    ctx.lineJoin = 'round'; 

    const lineHeight = parseInt(textState.fontSize);

    if (textState.direction === 'horizontal') {
        // --- CHỮ NẰM NGANG ---
        // Phải vẽ viền (strokeText) TRƯỚC, rồi mới tô màu (fillText) đè lên trên
        // thì viền mới bung ra ngoài và không "ăn" mất độ dày của chữ
        if (textState.strokeWidth > 0) {
            ctx.strokeText(textState.content, textState.x, textState.y);
        }
        ctx.fillText(textState.content, textState.x, textState.y);
        
        textState.width = ctx.measureText(textState.content).width;
        textState.height = lineHeight;
        
    } else {
        // --- CHỮ NẰM DỌC ---
        const chars = textState.content.split('');
        let maxWidth = 0;

        chars.forEach((char, index) => {
            const charY = textState.y + (index * lineHeight);
            
            if (textState.strokeWidth > 0) {
                ctx.strokeText(char, textState.x, charY);
            }
            ctx.fillText(char, textState.x, charY);

            const charWidth = ctx.measureText(char).width;
            if (charWidth > maxWidth) maxWidth = charWidth;
        });

        textState.width = maxWidth;
        textState.height = chars.length * lineHeight; 
    }
}

// 4. Lắng nghe thay đổi từ các ô nhập liệu (Input Listeners)

// Khi người dùng gõ chữ
textInput.addEventListener('input', (e) => {
    textState.content = e.target.value;
    drawCanvas();
});

// Khi người dùng đổi màu
textColorInput.addEventListener('input', (e) => {
    textState.color = e.target.value;
    drawCanvas();
});

// Khi người dùng đổi kích thước
fontSizeInput.addEventListener('input', (e) => {
    textState.fontSize = e.target.value;
    drawCanvas();
});

// Thêm đoạn này vào phần 4 (Lắng nghe thay đổi từ các ô nhập liệu)
fontFamilyInput.addEventListener('change', (e) => {
    textState.fontFamily = e.target.value;
    drawCanvas(); // Vẽ lại canvas với font mới
});

textDirectionInputs.forEach(radio => {
    radio.addEventListener('change', (e) => {
        textState.direction = e.target.value;
        drawCanvas();
    });
});

// Khi đổi màu viền
strokeColorInput.addEventListener('input', (e) => {
    textState.strokeColor = e.target.value;
    drawCanvas();
});

// Khi đổi độ dày viền
strokeWidthInput.addEventListener('input', (e) => {
    textState.strokeWidth = parseInt(e.target.value) || 0;
    drawCanvas();
});

// 5. Tích hợp lại tính năng Tải ảnh lên (Sử dụng drawCanvas)
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Đặt kích thước canvas bằng ảnh gốc
            canvas.width = img.width;
            canvas.height = img.height;
            // Lưu ảnh nền
            backgroundImage = img;
            // Vẽ lại toàn bộ (ảnh và chữ mặc định)
            drawCanvas();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});


// 6. Xử lý logic Kéo thả chữ (Drag and Drop)

// Hàm phụ để lấy tọa độ chuột relative và xử lý tỷ lệ thu phóng (Scale)
function getRelativeMouseCoords(event) {
    const rect = canvas.getBoundingClientRect();
    
    // Tính tỷ lệ giữa kích thước thật của canvas và kích thước hiển thị trên CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        // Nhân tọa độ hiển thị với tỷ lệ scale để ra tọa độ thật trên Canvas
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

// Hàm phụ để kiểm tra xem chuột có đang nằm TRÊN đoạn chữ không
function isMouseOverText(mouseX, mouseY) {
    // Vì ta đặt textBaseline="top", vùng va chạm là hình chữ nhật:
    // (x, y) -> (x + width, y + height)
    return (
        mouseX >= textState.x &&
        mouseX <= textState.x + textState.width &&
        mouseY >= textState.y &&
        mouseY <= textState.y + textState.height
    );
}

// A. Mousedown: Khi người dùng click chuột xuống
//--- LOGIC KÉO THẢ MỚI (CHỮ & STICKER) ---

canvas.addEventListener('mousedown', function(e) {
    const mousePos = getRelativeMouseCoords(e);
    
    // Ưu tiên 0: Kéo giãn (Resize) - Kiểm tra xem có đang bấm vào ô vuông của sticker đang chọn không
    if (selectedStickerIndex !== -1) {
        const st = stickers[selectedStickerIndex];
        // Tính tọa độ của ô vuông góc dưới bên phải
        const handleX = st.x + st.width - handleSize / 2;
        const handleY = st.y + st.height - handleSize / 2;

        if (mousePos.x >= handleX && mousePos.x <= handleX + handleSize &&
            mousePos.y >= handleY && mousePos.y <= handleY + handleSize) {
            
            draggingState.isDragging = true;
            draggingState.target = 'resize-sticker'; // Chuyển sang chế độ bóp méo
            draggingState.startX = mousePos.x;
            draggingState.startY = mousePos.y;
            return; // Dừng, không kiểm tra click di chuyển nữa
        }
    }

    // Ưu tiên 1: Chữ
    if (isMouseOverText(mousePos.x, mousePos.y)) {
        selectedStickerIndex = -1; // Bỏ chọn sticker để ẩn khung viền
        draggingState.isDragging = true;
        draggingState.target = 'text';
        draggingState.startX = mousePos.x;
        draggingState.startY = mousePos.y;
        canvas.style.cursor = 'grabbing';
        drawCanvas();
        return; 
    }

    // Ưu tiên 2: Di chuyển Sticker
    for (let i = stickers.length - 1; i >= 0; i--) {
        let st = stickers[i];
        if (mousePos.x >= st.x && mousePos.x <= st.x + st.width && 
            mousePos.y >= st.y && mousePos.y <= st.y + st.height) {
            
            selectedStickerIndex = i; // Đánh dấu sticker này đang được chọn
            draggingState.isDragging = true;
            draggingState.target = 'sticker';
            draggingState.stickerIndex = i; 
            draggingState.startX = mousePos.x;
            draggingState.startY = mousePos.y;
            canvas.style.cursor = 'grabbing';
            drawCanvas(); // Vẽ lại để hiện khung viền đứt nét lập tức
            return; 
        }
    }

    // Nếu bấm ra vùng trống (không trúng chữ, không trúng sticker)
    selectedStickerIndex = -1; // Tắt khung viền
    drawCanvas();
});

canvas.addEventListener('mousemove', function(e) {
    const mousePos = getRelativeMouseCoords(e);

    // -- Logic đổi hình con trỏ chuột --
    if (selectedStickerIndex !== -1 && !draggingState.isDragging) {
        const st = stickers[selectedStickerIndex];
        const handleX = st.x + st.width - handleSize / 2;
        const handleY = st.y + st.height - handleSize / 2;
        
        // Đổi thành mũi tên chéo khi rê chuột vào ô vuông kéo giãn
        if (mousePos.x >= handleX && mousePos.x <= handleX + handleSize &&
            mousePos.y >= handleY && mousePos.y <= handleY + handleSize) {
            canvas.style.cursor = 'nwse-resize'; 
        } else {
            canvas.style.cursor = 'default';
        }
    }

    // -- Logic Xử lý khi đang giữ chuột kéo --
    if (draggingState.isDragging) {
        const deltaX = mousePos.x - draggingState.startX;
        const deltaY = mousePos.y - draggingState.startY;

        if (draggingState.target === 'text') {
            textState.x += deltaX;
            textState.y += deltaY;
        } 
        else if (draggingState.target === 'sticker') {
            const st = stickers[draggingState.stickerIndex];
            st.x += deltaX;
            st.y += deltaY;
        } 
        else if (draggingState.target === 'resize-sticker') {
            // ĐÂY LÀ CHỖ KÉO GIÃN KÍCH THƯỚC
            const st = stickers[selectedStickerIndex];
            
            st.width += deltaX;
            st.height += deltaY;
            
            // Ép kích thước nhỏ nhất để hình không bị lộn ngược nếu đẩy chuột lố tay
            if (st.width < 20) st.width = 20;
            if (st.height < 20) st.height = 20;
        }

        draggingState.startX = mousePos.x;
        draggingState.startY = mousePos.y;
        drawCanvas();
    }
});

canvas.addEventListener('mouseup', function() {
    draggingState.isDragging = false;
    draggingState.target = null;
    canvas.style.cursor = 'default';
});

// D. Mouseleave: Khi người dùng di chuyển chuột ra khỏi canvas
canvas.addEventListener('mouseleave', function() {
    draggingState.isDragging = false;
    canvas.style.cursor = 'default';
});

// 7. Gọi drawCanvas() lần đầu để vẽ chữ mặc định lên canvas trống
drawCanvas();

// Lấy phần tử nút bấm từ HTML
const downloadBtn = document.getElementById('downloadBtn');

// Lắng nghe sự kiện click vào nút tải xuống
downloadBtn.addEventListener('click', function() {
    // 1. Chuyển đổi nội dung hiện tại của Canvas thành định dạng hình ảnh (Data URL)
    // Tùy chọn 'image/png' giúp giữ nguyên chất lượng tốt nhất
    const dataURL = canvas.toDataURL('image/png');
    
    // 2. Tạo một thẻ <a> (đường dẫn) ảo trong bộ nhớ trình duyệt
    const link = document.createElement('a');
    
    // 3. Gắn tên file mặc định khi tải về
    link.download = 'thiep-meme.png';
    
    // 4. Đưa dữ liệu ảnh vào thuộc tính href của thẻ <a>
    link.href = dataURL;
    
    // 5. Giả lập hành động click chuột vào thẻ <a> ảo này để ép trình duyệt tải file
    link.click();
});

// --- LOGIC THƯ VIỆN PHÔI ẢNH ---

// Lấy tất cả các ảnh trong thư viện
const templateImages = document.querySelectorAll('.template-img');

// Duyệt qua từng ảnh và thêm sự kiện click
templateImages.forEach(imgElement => {
    imgElement.addEventListener('click', function() {
        // Tạo một đối tượng Image mới
        const img = new Image();
        
        // Kích hoạt CORS để xử lý ảnh lấy từ domain khác (như Unsplash)
        img.crossOrigin = "Anonymous";
        
        // Khi ảnh từ thư viện đã tải xong...
        img.onload = function() {
            // Ép kích thước Canvas bằng kích thước ảnh mẫu
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Cập nhật biến nền và vẽ lại toàn bộ
            backgroundImage = img;
            drawCanvas();
        };
        
        // Truyền đường link của ảnh người dùng vừa bấm vào đối tượng img
        img.src = this.src;
    });
});

// --- LOGIC THÊM STICKER ---
const stickerBtns = document.querySelectorAll('.sticker-btn');

stickerBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
            // Khi tải xong, nhét sticker vào mảng
            stickers.push({
                image: img,
                x: canvas.width / 2 - 50, // Đặt ở giữa Canvas
                y: canvas.height / 2 - 50,
                width: 100,  // Kích thước mặc định của sticker
                height: 100
            });
            drawCanvas(); // Vẽ lại để hiện sticker
        };
        img.src = this.src;
    });
});

// --- LOGIC XÓA STICKER BẰNG PHÍM DELETE / BACKSPACE ---

// Lắng nghe sự kiện nhấn phím trên toàn bộ trang web (document)
document.addEventListener('keydown', function(e) {
    // 1. Kiểm tra xem người dùng có đang gõ chữ vào các ô input không
    // Nếu con trỏ chuột đang nháy trong thẻ <input> hoặc <select>, ta sẽ bỏ qua lệnh xóa này
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return; // Dừng hàm lại ngay
    }

    // 2. Kiểm tra xem phím được bấm có phải là Delete hoặc Backspace không
    if (e.key === 'Delete' || e.key === 'Backspace') {
        
        // 3. Kiểm tra xem có sticker nào đang được chọn (có khung viền) không
        if (selectedStickerIndex !== -1) {
            
            // Dùng hàm splice để "cắt" sticker đó khỏi mảng
            // Tham số đầu: vị trí bắt đầu cắt, Tham số hai: số lượng phần tử cần cắt (1 cái)
            stickers.splice(selectedStickerIndex, 1);
            
            // Xóa xong thì phải "tắt" chế độ đang chọn sticker đi
            selectedStickerIndex = -1;
            
            // Đề phòng trường hợp bồ vừa giữ chuột vừa bấm xóa
            draggingState.isDragging = false;
            draggingState.target = null;
            canvas.style.cursor = 'default';
            
            // 4. Vẽ lại Canvas (lúc này mảng stickers đã mất đi 1 phần tử nên nó sẽ biến mất)
            drawCanvas();
        }
    }

    // --- LOGIC ĐƯA STICKER LÊN TRÊN CÙNG (MỚI THÊM) ---
    // Hỗ trợ cả phím PageUp hoặc phím ] (giống Photoshop)
    if (e.key === 'PageUp' || e.key === ']') {
        
        // Kiểm tra xem có sticker nào đang được chọn không
        if (selectedStickerIndex !== -1) {
            
            // 1. Cắt sticker đang chọn ra khỏi mảng
            // Hàm splice trả về một mảng chứa phần tử bị cắt, nên ta thêm [0] để lấy chính cái sticker đó
            const stickerToMove = stickers.splice(selectedStickerIndex, 1)[0];
            
            // 2. Nhét nó vào vị trí cuối cùng của mảng (lớp trên cùng)
            stickers.push(stickerToMove);
            
            // 3. Cập nhật lại vị trí Index đang chọn thành vị trí cuối cùng
            selectedStickerIndex = stickers.length - 1;
            
            // 4. Vẽ lại Canvas
            drawCanvas();
        }
    }
});