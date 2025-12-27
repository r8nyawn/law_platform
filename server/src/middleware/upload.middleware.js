const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку для загрузок если её нет
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    
    if (file.fieldname === 'avatar') {
      folder = 'avatars';
    } else if (file.fieldname === 'document') {
      folder = 'documents';
    } else if (file.fieldname === 'articleImage') {
      folder = 'articles';
    }
    
    const dir = path.join(uploadDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Фильтрация файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'avatar': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    'document': ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    'articleImage': ['image/jpeg', 'image/jpg', 'image/png']
  };

  const allowedMimeTypes = allowedTypes[file.fieldname] || ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла'), false);
  }
};

// Настройка загрузчика
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  }
});

// Экспортируем отдельные загрузчики для разных целей
exports.uploadAvatar = upload.single('avatar');
exports.uploadDocument = upload.single('document');
exports.uploadArticleImage = upload.single('articleImage');
exports.uploadMultiple = upload.array('files', 5); // Макс 5 файлов