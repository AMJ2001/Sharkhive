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
    setShowMenu(showMenu === id ? null : id); // Toggle menu visibility
  };

  const handleUpload = () => {
    alert("File uploaded!");
  };

  return (
    <div className="homepage">
      {/* Header with user info */}
      <header className="header">
        <div className="user-name">Welcome {userData.name || userData.email.trim().split('@')[0].split('.')[0]}</div>
      </header>

      {/* Central File Structure */}
      <div className="file-structure">
        <h1> Directory </h1>
        {fileStructure?.length > 0 ? (
          fileStructure.map((item) => (
            <div className="folder" key={item.file_name}>
              <div className="folder-header">
                <span className="folder-name">{item.file_name}</span>
                <div className="folder-menu" onClick={() => handleMenuClick(item.file_name)}>
                  {showMenu === item.file_name && (
                    <div className="menu-options">
                      <button>Open</button>
                      <button>View</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Render file details if no folder, directly from the file structure */}
              <div className="file-items">
                <div className="file-item" key={item.file_name}>
                  <span>{item.file_name}</span>
                  <div className="file-type">{item.file_type}</div>
                  <div className="file-size">
                    {item.file_size ? (item.file_size / 1024).toFixed(2) : 0} KB
                  </div>
                  <div className="upload-date">{new Date(item.upload_date).toLocaleString()}</div>
                  <div className="file-url">{item.file_url}</div>

                  <div className="file-menu" onClick={() => handleMenuClick(item.file_name)}>
                    <span className="menu-icon">•••</span>
                    {showMenu === item.file_name && (
                      <div className="menu-options">
                        <button>Open</button>
                        <button>View</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-files">No files available</div>
        )}
    </div>
       {/* Upload Button */}
       <div className="upload-btn">
      {userData.role === 'admin' && (<button onClick={handleUpload}>Upload File</button>)}
      </div>
    </div>
  );
};

export default HomePage;