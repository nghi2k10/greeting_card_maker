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
    startX: 0, // Vị trí chuột lúc bắt đầu click
    startY: 0
};


// 3. Hàm cốt lõi: Vẽ lại toàn bộ Canvas
function drawCanvas() {
    // A. Xóa sạch Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // B. Vẽ ảnh nền (nếu có)
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0);
    }

    // C. Vẽ chữ
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
canvas.addEventListener('mousedown', function(e) {
    const mousePos = getRelativeMouseCoords(e);
    
    // Kiểm tra xem có click trúng chữ không
    if (isMouseOverText(mousePos.x, mousePos.y)) {
        draggingState.isDragging = true;
        
        // Lưu lại vị trí chuột lúc click để tính độ chênh lệch
        draggingState.startX = mousePos.x;
        draggingState.startY = mousePos.y;

        // Đổi con trỏ chuột thành hình 'bàn tay đang nắm'
        canvas.style.cursor = 'grabbing';
    }
});

// B. Mousemove: Khi người dùng di chuyển chuột
canvas.addEventListener('mousemove', function(e) {
    const mousePos = getRelativeMouseCoords(e);

    // Xử lý logic Đổi con trỏ chuột khi đi qua chữ
    if (isMouseOverText(mousePos.x, mousePos.y)) {
        if (!draggingState.isDragging) {
            canvas.style.cursor = 'grab'; // Con trỏ bàn tay mở
        }
    } else {
        if (!draggingState.isDragging) {
            canvas.style.cursor = 'default'; // Con trỏ mặc định
        }
    }

    // Xử lý logic kéo thả chính
    if (draggingState.isDragging) {
        // Tính độ chênh lệch di chuyển
        const deltaX = mousePos.x - draggingState.startX;
        const deltaY = mousePos.y - draggingState.startY;

        // Cập nhật tọa độ (x, y) mới cho chữ
        textState.x += deltaX;
        textState.y += deltaY;

        // Cập nhật vị trí chuột cho lần di chuyển tiếp theo
        draggingState.startX = mousePos.x;
        draggingState.startY = mousePos.y;

        // Vẽ lại toàn bộ Canvas với vị trí chữ mới
        drawCanvas();
    }
});

// C. Mouseup: Khi người dùng nhả chuột ra
canvas.addEventListener('mouseup', function() {
    draggingState.isDragging = false;
    // Không đổi cursor ở đây, để nó tự xử lý ở mousemove
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