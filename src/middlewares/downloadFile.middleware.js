import fs from "fs";

const downloadFile = (req, res, next) => {
  const filename = req.params.filename;
  const filePath = `public/${filename}`;

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(404).send("File not found");
    } else {
      res.send(data);

      // Delete the file after it has been downloaded
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("File deleted:", filename);
        }
      });
    }
  });
};

export default downloadFile;
