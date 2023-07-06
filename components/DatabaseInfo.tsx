import React from "react";

import styles from "../styles/index.module.scss"

const DatabaseInfo = () => {
  return (
    <table>
      <thead>
        <tr className={styles.databaseGrid}>
          <th>Database Type</th>
          <th>Instance Type</th>
          <th>RAM</th>
          <th>CPU</th>
          <th>Location</th>
          <th>Provider</th>
        </tr>
      </thead>
      <tbody>
        <tr className={styles.databaseGrid}>
          <td>
            <span className={styles.badgeGray}>PostgreSQL</span>
          </td>
          <td>
            <span className={styles.badgeGray}>
            db.m5.large
          </span>
          </td>
          <td>
            <span className={styles.badgeGray}>
            8GB
          </span>
          </td>
          <td>
            <span className={styles.badgeGray}>
            2 vCPU
          </span>
          </td>
          <td>
            <span className={styles.badgeGray}>
            us-east-1
          </span>
          </td>
          <td>
            <span className={styles.badgeGray}>
            AWS
          </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default DatabaseInfo;
