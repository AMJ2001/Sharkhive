import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './App.css'; 

const HomePage = () => {
  const [showMenu, setShowMenu] = useState(null); 
  const [fileStructure, setFileStructure] = useState([]);
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData || Object.keys(userData).length === 0) {
      navigate('/login');
    } else {
      fetchFileStructure();
    }
  }, [userData, navigate]);

  const fetchFileStructure = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/files/', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setFileStructure(data);
      console.log(fileStructure);
    } catch (error) {
      console.error('Error fetching file structure:', error);
    }
  };

  const handleMenuClick = (id) => {
    setShowMenu(showMenu === id ? null : id);
  };

  const handleUpload = () => {
    alert("File uploaded!");
  };

  return (
    <div className="homepage">
      <header className="header">
        <div className="user-name">
          Welcome {userData.name || userData.email?.trim().split('@')[0].split('.')[0]}
        </div>
      </header>
  
      <div className="file-cards-container">
        <h1 className="directory-heading">Directory</h1>
        {fileStructure?.length > 0 ? (
          fileStructure.map((item) => (
            <div className="file-card" key={item.file_name}>
              {/* Random Logo */}
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
                    <button>Delete</button>
                    <button>Share</button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-files">No files available</div>
        )}
      </div>
  
      <div className="upload-btn">
        {userData.role === 'admin' && (<button onClick={handleUpload}>Upload File</button>)}
      </div>
    </div>
  );
};

export default HomePage;