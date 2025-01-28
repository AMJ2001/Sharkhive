import React, { useState } from "react";
import '.'

const FileUploadPopup = ({ onClose, onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [destination, setDestination] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleOptionSelect = (destination) => {
    onFileUpload(destination);
    onClose();
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && destination) {
      onFileUpload(file, destination);
      onClose();
    } else {
      alert("Please select a file and destination.");
    }
  };

  return (
    <div className="upload-popup-overlay">
      <div className="upload-popup">
      <button className="close-button" onClick={onClose}>✖</button>
        <h2 className="popup-title">Upload File</h2>

        {!showOptions ? (
          <div className="upload-options">
            <button
              className="option-button"
              onClick={() => handleOptionSelect("Sharkhive")}
            >
              Upload to Sharkhive
            </button>
            <button
              className="option-button"
              onClick={() => handleOptionSelect("NextCloud")}
            >
              Upload to NextCloud
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="file-upload-form">
            <div className="form-group">
              <label htmlFor="fileInput" className="form-label">
                Select File:
              </label>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                className="file-input"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                Upload
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FileUploadPopup;