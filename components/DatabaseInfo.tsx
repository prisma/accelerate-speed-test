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
          <td>PostgreSQL</td>
          <td>db.m5.large</td>
          <td>8GB</td>
          <td>2 vCPU</td>
          <td>us-east-1</td>
          <td>AWS</td>
        </tr>
      </tbody>
    </table>
  );
};

export default DatabaseInfo;
