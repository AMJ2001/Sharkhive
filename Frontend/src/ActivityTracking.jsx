import React from 'react';
import { useSelector } from "react-redux";

const ActivityTracking = () => {
const userData = useSelector((state) => state.user.userData);

  const data = [
    {
      name: 'John',
      privilege: 'Administrator',
      activity: 'Upload',
      time: '28th January, 2025; 12:24pm',
      fileInfo: 'Newimage.png: 18kb',
    },
  ];

  return (
    <div className="activity-tracking-container">
        {userData.role !== 'admin' ? (<h1> Unauthorized! </h1>) : (
            <div className="activity-tracking-container">
            <h1 className="activity-heading">Most Recent Activities</h1>
            <table className="activity-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Privilege</th>
                    <th>Activity</th>
                    <th>Time</th>
                    <th>File Info</th>
                </tr>
                </thead>
                <tbody>
                {data.map((item, index) => (
                    <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.privilege}</td>
                    <td>{item.activity}</td>
                    <td>{item.time}</td>
                    <td>{item.fileInfo}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )} 
    </div>
  );
};

export default ActivityTracking;