import React, { useState } from 'react';
import './App.css'; 

const HomePage = () => {
  const [showMenu, setShowMenu] = useState(null); // Track which folder/file menu is open
  const [fileStructure, setFileStructure] = useState([
    { name: 'Documents', type: 'folder', id: 1, items: [] },
    { name: 'Images', type: 'folder', id: 2, items: [] },
  ]);

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
        <div className="user-name">John Doe</div>
      </header>

      {/* Central File Structure */}
      <div className="file-structure">
        {fileStructure.map((folder) => (
          <div className="folder" key={folder.id}>
            <div className="folder-header">
              <span className="folder-name">{folder.name}</span>
              <div className="folder-menu" onClick={() => handleMenuClick(folder.id)}>
                <span className="menu-icon">•••</span>
                {showMenu === folder.id && (
                  <div className="menu-options">
                    <button>Delete</button>
                    <button>Share</button>
                  </div>
                )}
              </div>
            </div>
            {folder.items.length === 0 ? (
              <div className="empty-folder">No files here</div>
            ) : (
              <div className="file-items">
                {/* Render files inside folder */}
                {folder.items.map((file) => (
                  <div className="file-item" key={file.id}>
                    <span>{file.name}</span>
                    <div className="file-menu" onClick={() => handleMenuClick(file.id)}>
                      <span className="menu-icon">•••</span>
                      {showMenu === file.id && (
                        <div className="menu-options">
                          <button>Delete</button>
                          <button>Share</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <div className="upload-btn">
        <button onClick={handleUpload}>Upload File</button>
      </div>
    </div>
  );
};

export default HomePage;