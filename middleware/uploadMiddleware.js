
import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/; 
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype) { 
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, 
    },
});

export const uploadSingleImage = upload.single('productImage'); 