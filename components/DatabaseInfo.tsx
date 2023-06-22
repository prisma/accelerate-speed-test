import React from "react";

const DatabaseInfo = () => {
  return (
    <table>
      <thead>
        <tr>
          <th>Database Type</th>
          <th>Instance Type</th>
          <th>RAM</th>
          <th>CPU</th>
          <th>Location</th>
          <th>Provider</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <span>PostgreSQL</span>
          </td>
          <td>
            <span>db.m5.large</span>
          </td>
          <td>
            <span>8GB</span>
          </td>
          <td>
            <span>2 vCPU</span>
          </td>
          <td>
            <span>us-east-1</span>
          </td>
          <td>
            <span>AWS</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default DatabaseInfo;
