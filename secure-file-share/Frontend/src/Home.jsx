import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import FileUploadPopup from "./FileUploadPopup.tsx";
import ShareLinkPopup from "./ShareLinkPopup.tsx";

const HomePage = () => {
  const [showMenu, setShowMenu] = useState(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [fileStructure, setFileStructure] = useState([]);
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const fetchFileStructure = async () => {
    try {
      const response = await fetch("https://localhost:8000/api/files/", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (response.status === 401 || ((response.status === 400) && data.error?.includes('Authorization token'))) {
        navigate('/login');
      }
      setFileStructure(data);
    } catch (error) {
      console.log(error, error.message);
      console.error("Error fetching file structure:", error);
    }
  };

  useEffect(() => {
    if (userData && Object.keys(userData).length > 0) {
      fetchFileStructure();
      setIsLoading(false);
    } else if (!userData || Object.keys(userData).length === 0) {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (!isLoading) {
      if (!userData || Object.keys(userData).length === 0) {
        navigate("/login");
      }
    }
  }, [isLoading, userData, navigate]);

  if (isLoading) {
    return <div className="directory-heading">Please login.</div>;
  }

  
  const encryptFile = async (file) => {
    const key = await window.crypto.subtle.generateKey({
        name: "AES-GCM",
        length: 256,
      }, true, ["encrypt", "decrypt"]);
  
    const fileArrayBuffer = await file.arrayBuffer();
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: window.crypto.getRandomValues(new Uint8Array(12)),
      },
      key,
      fileArrayBuffer
    );
    const encryptedBlob = new Blob([encryptedData], { type: file.type });
    return encryptedBlob;
  };

  const handleMenuClick = (id) => {
    setShowMenu(showMenu === id ? null : id);
  };

  const handleUpload = () => {
    setShowUploadPopup(true);
  };
  
  const handleFileUpload = async (destination) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
  
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const encryptedFile = await encryptFile(file);
  
          const formData = new FormData();
          formData.append("file", encryptedFile);
          formData.append("file_name", file.name);
          formData.append("file_type", file.type);
          formData.append("destination", destination);
  
          const response = await fetch("https://localhost:8000/api/upload/", {
            method: "POST",
            credentials: "include",
            body: formData,
          });
  
          if (response.ok) {
            const data = await response.json();
            alert(`File uploaded successfully: ${data.file_url}`);
            window.location.reload();
          } else {
            const errorData = await response.json();
            alert(`Failed to upload file: ${errorData.error}`);
          }
        } catch (error) {
          alert(`An error occurred: ${error.message}`);
        }
      }
    };
  
    input.click();
  };

  const handleShare = (file) => {
    setSelectedFile(file);
    setShowSharePopup(true);
  };

  return (
    <div className="homepage">
      <header className="header">
        <div className="user-name">
          Welcome {userData.name || userData.email?.trim().split('@')[0].split('.')[0]}
        </div>
        {userData.role === 'admin' && (
          <button className="activity-redirect" onClick={() => navigate('/activities')}> Activity Tracking </button>
        )}
      </header>
  
      <div className="file-cards-container">
        <h1 className="directory-heading">Directory</h1>
        {fileStructure?.length > 0 ? (
          fileStructure.map((item) => (
            <div className="file-card" key={item.file_name}>

              <div className="file-card-logo">
                <img src="/fileIcon.png" alt="File Logo" className="file-logo" />
              </div>
  
              {/* File Details */}
              <div className="file-details">
                <div className="file-name">
                  <strong>Name:</strong> {item.file_name}
                </div>
                <div className="file-type">
                  <strong>Type:</strong> {item.file_type}
                </div>
                <div className="file-size">
                  <strong>Size:</strong> {item.file_size ? (item.file_size / 1024).toFixed(2) : 0} KB
                </div>
                <div className="upload-date">
                  <strong>Uploaded:</strong> {new Date(item.upload_date).toLocaleString()}
                </div>
                <div className="file-url">
                  <strong>URL:</strong> <a href={item.file_url} target="_blank" rel="noopener noreferrer">{item.file_url}</a>
                </div>
              </div>
  
              {/* File Menu */}
              <div className="file-menu" onClick={() => handleMenuClick(item.file_name)}>
                <span className="menu-icon">•••</span>
                {showMenu === item.file_name && (
                  <div className="menu-options">
                    <button onClick={() => handleShare(item)}>Share</button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-files">No files available</div>
        )}

        {showSharePopup && (
        <ShareLinkPopup
          file={selectedFile}
          onClose={() => setShowSharePopup(false)}
          onLinkGenerated={(link) => console.log("Generated Link:", link)}
        />
      )}
      </div>
        
      <div className="upload-btn">
          {["admin", "standard"].includes(userData.role) && (
            <button onClick={handleUpload}>Upload File</button>
          )}
          {showUploadPopup && (
            <FileUploadPopup
              onClose={() => setShowUploadPopup(false)}
              onFileUpload={(destination) => handleFileUpload(destination)}
            />
          )}
        </div>
      </div>
  );
};

export default HomePage;