import React, { useState } from "react";

const ShareLinkPopup = ({ file, onClose, onLinkGenerated }) => {
  const [expiryTime, setExpiryTime] = useState(60);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (expiryTime <= 0) {
      alert("Expiration time must be a positive number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/share-file/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.file_name,
          expiration_minutes: expiryTime,
          email: email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Link generated successfully: ${data.shareable_link}`);
        onLinkGenerated(data.shareable_link);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to generate link: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("An error occurred: " + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="share-popup-overlay">
      <div className="share-popup-content">
        <h2>Share File</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleShare();
          }}
        >
          <div>
            <label>Expiration Time (minutes):</label>
            <input
              type="number"
              value={expiryTime}
              onChange={(e) => setExpiryTime(e.target.value)}
              min="1"
            />
          </div>
          <div>
            <label>Email (optional):</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="share-popup-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Shareable Link"}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareLinkPopup;