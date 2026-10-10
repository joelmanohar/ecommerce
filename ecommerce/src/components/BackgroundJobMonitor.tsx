import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const WEBSOCKET_URL = `${API_BASE_URL.replace(/^http/, "ws")}/ws-smartcart`;

type Job = {
  jobId: number;
  orderId: number;
  jobType: string;
  status: string;
  message: string;
  updatedAt: string;
};

function BackgroundJobMonitor() {

  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {

    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/api/jobs`, {
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
      })
      .catch(console.error);

    const client = new Client({
      brokerURL: WEBSOCKET_URL,
      reconnectDelay: 5000,

      onConnect: () => {

        client.subscribe("/topic/jobs", message => {

          const updatedJob: Job =
            JSON.parse(message.body);

          setJobs(old => {

            const exists = old.some(
              job => job.jobId === updatedJob.jobId
            );

            return exists
              ? old.map(job =>
                  job.jobId === updatedJob.jobId
                    ? updatedJob
                    : job
                )
              : [updatedJob, ...old];
          });
        });
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };

  }, []);

  return (
    <div className="job-monitor">

      <h2>Background Job Monitor</h2>

      <table>

        <thead>
          <tr>
            <th>Job ID</th>
            <th>Order ID</th>
            <th>Task</th>
            <th>Status</th>
            <th>Message</th>
          </tr>
        </thead>

        <tbody>

          {jobs.map(job => (

            <tr key={job.jobId}>

              <td>{job.jobId}</td>
              <td>{job.orderId}</td>
              <td>{job.jobType}</td>

              <td className={job.status.toLowerCase()}>
                {job.status}
              </td>

              <td>{job.message}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default BackgroundJobMonitor;
