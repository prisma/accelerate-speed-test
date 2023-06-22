import Image from "next/image";

export const CacheAnimation: React.FC<{
  location?: string;
  skipCache: boolean;
}> = ({ location, skipCache }) => {
  return (
    <>
      <div
        className="accelerate-image-group min-w-[100%]"
        style={{
          padding: "10px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            textAlign: "left",
            display: "relative",
          }}
        >
          {location ? <span>{location}</span> : <br></br>}
          <Image
            width={20}
            height={20}
            className="accelerate-server-img"
            src="/server.svg"
            alt="Server icon"
          ></Image>
          <p>Vercel Edge Server</p>
        </div>
        {!skipCache && (
          <>
            <div className="line-space">
              <div className="line"></div>
            </div>
            <div
              style={{
                fontSize: "12px",
                textAlign: "left",
                display: "relative",
              }}
            >
              {location ? <span>{location}</span> : <br></br>}
              <Image
                width={20}
                height={20}
                className="accelerate-cache-img"
                src="/cache.svg"
                alt="Cache icon"
              ></Image>
              <p>Accelerate cache</p>
            </div>
          </>
        )}
        <div className="line-longer-space">
          <div className="line-longer"></div>
        </div>
        <div>
          <div
            style={{
              fontSize: "12px",
              textAlign: "left",
              display: "relative",
            }}
          >
            <span style={{ fontSize: "10px" }}>N. Virginia</span>
            <Image
              width={20}
              height={20}
              className="accelerate-database-img"
              src="/database.png"
              alt="database icon"
            ></Image>
            <p>Database</p>
          </div>
        </div>
      </div>
    </>
  );
};
