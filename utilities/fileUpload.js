const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const uploadToS3 = function () {
  aws.config.update({
    secretAccessKey: process.env.s3_secret_access_key,
    accessKeyId: process.env.s3_access_key_id,
    region: process.env.s3_region
  });

  const s3 = new aws.S3();

  const fileFilter = function (req, file, cb) {
    if (
      !file.mimetype === 'image/jpg' ||
      !file.mimetype === 'image/jpeg' ||
      !file.mimetype === 'image/png'
    ) {
      return cb(new Error('Only image files are allowed!'));
    }
    return cb(null, true);
  };

  return multer({
    fileFilter,
    storage: multerS3({
      s3,
      bucket: process.env.s3_bucket_name,
      acl: 'public-read',
      metadata(req, file, cb) {
        cb(null, {
          fieldName: file.fieldname
        });
      },
      key(req, file, cb) {
        cb(null, Date.now().toString());
      }
    })
  });
};

const singleUploadToS3 = function (req, res, next) {
  const upload = uploadToS3();
  const singleUpload = upload.single('image');

  singleUpload(req, res, function (err) {
    if (err) {
      console.log(err, new Date());
      return false;
    }
    return next();
  });
};

module.exports = {
  singleUploadToS3
};
