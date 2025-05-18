import React, { useEffect, useRef, useState } from "react";
import { Button, IconButton, TextField } from "@mui/material";
import { io } from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

import CallEnd from "@mui/icons-material/CallEnd";

import styles from "../styles/videoComponent.module.css";

const server_url = "http://localhost:8000";

var connections = {};
var iceCandidateQueues = {};

const peerConfigConnections = {
  iceServer: [{ url: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState();
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("Attached localStream to video element", localStream);
    }
  }, [localStream]);

  function connectToSocketServer(stream) {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id; // Store socket id separately
      socketRef.current.on("chat-message", addMessage);
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });
      socketRef.current.on("user-joined", (id, clients) => {
        // For every client except self, create a connection if not already present
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;
          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(
              peerConfigConnections
            );
            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate !== null) {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ ice: event.candidate })
                );
              }
            };
            connections[socketListId].ontrack = (event) => {
              const incomingStream =
                event.streams && event.streams[0] ? event.streams[0] : null;
              if (!incomingStream) return;
              let videoExists = videoRef.current.find(
                (video) => video.socketId === socketListId
              );
              if (videoExists) {
                setVideos((videos) => {
                  const updatedVideos = videos.map((video) =>
                    video.socketId === socketListId
                      ? { ...video, stream: incomingStream }
                      : video
                  );
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                });
              } else {
                let newVideo = {
                  socketId: socketListId,
                  stream: incomingStream,
                  autoPlay: true,
                  playsinline: true,
                };
                setVideos((videos) => {
                  const updatedVideos = [...videos, newVideo];
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                });
              }
            };
            // Add local tracks
            if (stream) {
              stream.getTracks().forEach((track) => {
                connections[socketListId].addTrack(track, stream);
              });
            }
          }
        });
        // Now, for every other client, create an offer if we are the new user
        if (id === socketIdRef.current) {
          clients.forEach((socketListId) => {
            if (socketListId === socketIdRef.current) return;
            connections[socketListId].createOffer().then((description) => {
              connections[socketListId]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    socketListId,
                    JSON.stringify({
                      sdp: connections[socketListId].localDescription,
                    })
                  );
                })
                .catch((e) => console.log(e));
            });
          });
        }
        // For existing users, if a new user joined, create an offer to them
        else {
          if (id && id !== socketIdRef.current && connections[id]) {
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  }

  function getMedia() {
    setAudio(audioAvailable);
    navigator.mediaDevices
      .getUserMedia({ video: videoAvailable, audio: audioAvailable })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        connectToSocketServer(stream);
      })
      .catch((err) => {
        setVideoAvailable(false);
        setAudioAvailable(false);
        console.error("getUserMedia error:", err);
      });
  }

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            // Add any queued ICE candidates after setting remote description
            if (iceCandidateQueues[fromId]) {
              iceCandidateQueues[fromId].forEach((candidate) => {
                connections[fromId]
                  .addIceCandidate(candidate)
                  .catch((e) => console.log(e));
              });
              iceCandidateQueues[fromId] = [];
            }
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
    }
    if (signal.ice) {
      if (
        connections[fromId] &&
        connections[fromId].remoteDescription &&
        connections[fromId].remoteDescription.type
      ) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      } else {
        // Queue ICE candidates until remote description is set
        if (!iceCandidateQueues[fromId]) iceCandidateQueues[fromId] = [];
        iceCandidateQueues[fromId].push(new RTCIceCandidate(signal.ice));
      }
    }
  };

  let addMessage = () => {};

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  };
  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>
          <div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              style={{ border: "2px solid red", background: "black" }}
              poster="https://dummyimage.com/300x200/000/fff&text=No+Video"
            ></video>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          <div className={styles.buttonContainer}>
            <IconButton style={{ color: "white" }}>
              {videoAvailable ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton style={{ color: "red" }}>
              <CallEnd />
            </IconButton>
            <IconButton style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
            style={{ border: "2px solid red", background: "black" }}
            poster="https://dummyimage.com/300x200/000/fff&text=No+Video"
          ></video>
          {videos
            .filter((video) => video.socketId !== socketIdRef.current) // Only show remote videos
            .map((video) => (
              <div className={styles.conferenceView} key={video.socketId}>
                <h2>{video.socketId}</h2>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <video
                    className={styles.meetUserVideo}
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    style={{
                      width: "300px",
                      margin: "10px",
                      border: "2px solid red",
                      background: "black",
                    }}
                    poster="https://dummyimage.com/300x200/000/fff&text=No+Video"
                  />
                  {/* Debug overlay to show if stream is attached */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      color: "lime",
                      background: "rgba(0,0,0,0.5)",
                      fontSize: "12px",
                      padding: "2px 4px",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    {video.stream ? "Stream attached" : "No stream"}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
