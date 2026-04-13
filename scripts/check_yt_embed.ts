import axios from "axios";
axios.get("https://www.youtube.com/embed/q2J651TY8_o")
  .then(res => {
    if (res.data.includes("Video unavailable") || res.data.includes("UNPLAYABLE")) {
      console.log("NOT EMBEDDABLE");
    } else {
      console.log("EMBEDDABLE");
    }
  }).catch(e => console.log("ERROR"));
