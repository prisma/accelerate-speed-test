import React from "react";

import styles from "../styles/index.module.scss"

const dbInfo = [
  {
    title: "Database Protocol",
    content: "PostgresSQL"
  },
  {
    title: "Instance Type",
    content: "db.m5.large"
  },
  {
    title: "RAM",
    content: "8GB"
  },
  {
    title: "CPU",
    content: "2 vCPU"
  },
  {
    title: "Location",
    content: "us-east-1"
  },
  {
    title: "Provider",
    content: "AWS"
  }
]

const DatabaseInfo = () => {
  return (
    <table className={styles.databaseDesktop}>
      <thead>
        <tr className={styles.databaseGrid}>
          {dbInfo.map((e: any) => <th key={e.title}>{e.title}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr className={styles.databaseGrid}>
          {dbInfo.map((e: any) => 
            <td key={e.title}>
              <span className={styles.badgeGray}>{e.content}</span>
            </td>
          )}
        </tr>
      </tbody>
    </table>
  );
};

const DatabaseInfoMobile = () => {
  return (
    <div className={styles.databaseMobile}>
      {dbInfo.map((e: any) =>
        <div className={styles.databaseItem} key={e.title}>
          <div>{e.title}</div>
          <p>
            <span className={styles.badgeGray}>{e.content}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export { DatabaseInfo, DatabaseInfoMobile };
