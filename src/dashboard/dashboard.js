import { list } from "postcss";
import { fetchRequest } from "../api";
import { ENDPOINT, logout, SECTIONTYPE } from "../common";

let userName;
const audio = new Audio();
const volume = document.querySelector("#volume");
const playButton = document.querySelector("#play");
const nextButton = document.querySelector("#next");
const prevButton = document.querySelector("#prev");
const totalSongDuration = document.querySelector("#total-song-duration");
const songDurationCompleted = document.querySelector(
  "#song-duration-completed"
);
const songProgress = document.querySelector("#progress");
let songList;
let progressInterval;
let prevTrackSongID;
let currentTrackIndex;
let numberOfSongs;

const loadUserProfile = async () => {
  const defaultImage = document.querySelector("#default-image");
  const profileButton = document.querySelector("#user-profile-btn");
  const displayNameElement = document.querySelector("#display-name");

  const onProfileClick = (event) => {
    event.stopPropagation();
    const profileMenu = document.querySelector("#profile-menu");
    const dropDownButton = document.querySelector("#drop-down-button");
    profileMenu.classList.toggle("hidden");
    if (!profileMenu.classList.contains("hidden")) {
      dropDownButton.textContent = "arrow_drop_up";
      profileMenu.querySelector("li#logout").onclick = logout;
    } else {
      dropDownButton.textContent = "arrow_drop_down";
    }
  };

  const { display_name: displayName, images } = await fetchRequest(
    ENDPOINT.userInfo
  );

  if (images?.length) {
    defaultImage.classList.add("hidden");
  } else {
    defaultImage.classList.remove("hidden");
  }

  profileButton.addEventListener("click", onProfileClick);
  displayNameElement.textContent = displayName;
};

const salutation = () => {
  const date = new Date();
  const hour = date.getHours();
  console.log(hour);
  if (hour >= 5 && hour <= 12) {
    console.log("1");
    return "Good morning";
  }
  if (hour <= 17) {
    console.log("2");
    return "Good afternoon";
  }
  console.log("3");
  return "Good evening";
};

const onPlaylistItemClicked = (event, id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
  history.pushState(section, "", `playlist${id}`);
  loadSection(section);
};

const loadPlaylist = async (endpoint, elementID) => {
  const {
    playlists: { items },
  } = await fetchRequest(endpoint);
  const playlistItemSection = document.querySelector(`#${elementID}`);
  for (let {
    id,
    name,
    description,
    images: [{ url }],
  } of items) {
    const playlistItem = document.createElement("section");
    playlistItem.className =
      "flex flex-col justify-start gap-2 rounded-md bg-black-secondary p-4 hover:bg-light-black cursor-pointer";
    playlistItem.id = id;
    playlistItem.setAttribute("data-type", "playlist");
    playlistItem.innerHTML = `<img
    class="rounded-md object-contain shadow-xl"
    src="${url}"
    alt=""
  />
  <h2 class="text-base mb-4 font-semibold truncate">${name}</h2>
  <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>`;

    playlistItemSection.appendChild(playlistItem);
    playlistItem.addEventListener("click", (event) => {
      onPlaylistItemClicked(event, id);
    });
  }
};

const loadAllPlaylists = () => {
  loadPlaylist(ENDPOINT.featuredPlaylist, "featured-playlist-items");
  loadPlaylist(ENDPOINT.topPlaylist, "top-playlist-items");
};

const skeletonOfDashboardContent = () => {
  const pageContent = document.querySelector("#page-content");
  const coverContent = document.querySelector("#cover-content");
  coverContent.innerHTML = `<h1 class="text-6xl font-semibold">${salutation()}</h1>`;

  const playlistMap = new Map([
    ["Featured", "featured-playlist-items"],
    ["Top Playlists", "top-playlist-items"],
  ]);
  let innerHTML = ``;
  for (let [type, id] of playlistMap) {
    innerHTML += `
    <article class="p-4">
          <h1 class="mb-4 text-2xl" font-bold capitalize>${type}</h1>
          <section
            id=${id}
            class="features-songs grid grid-cols-auto-fill-cards gap-4"
          ></section>
        </article>
    `;
  }
  pageContent.innerHTML = innerHTML;
};

const formatTime = (duration) => {
  let min = Math.floor(duration / 60_000);
  let sec = ((duration % 60_000) / 1000).toFixed(0);
  if (sec < 10) {
    sec = `0${sec}`;
  } else {
    sec = `${sec}`;
  }
  return `${min}:${sec}`;
};

const onPlayButtonClick = (id) => {
  const playButtonOnTrack = document.querySelector(`#play-track${id}`);
  const playButtonInFooter = playButton.querySelector("span");
  let prevTrackSongButton;
  if (prevTrackSongID) {
    if (prevTrackSongID != id) {
      const songTrack = document.getElementById(`${prevTrackSongID}`);
      const prevSongName = songTrack?.querySelector(`.song-name`);
      const trackNumber = songTrack?.querySelector(`.track-no`);
      prevSongName?.classList.remove("song-playing-green");
      trackNumber?.classList.remove("song-playing-green");
    }
    prevTrackSongButton = document.querySelector(
      `#play-track${prevTrackSongID}`
    );
    if (prevTrackSongButton) {
      prevTrackSongButton.textContent = "play_arrow";
    }
  }
  if (audio.paused) {
    if (id) {
      audio.play();
      playButtonInFooter.textContent = "pause_circle";
      playButton.id = id;
    } else {
      playButtonInFooter.textContent = "play_circle";
    }

    if (playButtonOnTrack) {
      const songTrack = document.getElementById(`${id}`);
      const songName = songTrack.querySelector(`.song-name`);
      const trackNumber = songTrack.querySelector(`.track-no`);
      songName.classList.add("song-playing-green");
      trackNumber.classList.add("song-playing-green");
      prevTrackSongID = id;
      playButtonOnTrack.textContent = "pause";
    }
  } else {
    if (id) {
      audio.pause();
      playButtonInFooter.textContent = "play_circle";
    } else {
      playButtonInFooter.textContent = "pause_circle";
    }
    if (playButtonOnTrack) {
      playButtonOnTrack.textContent = "play_arrow";
    }
  }
  audio.onended = () => {
    playButtonInFooter.textContent = "play_circle";
    playButtonOnTrack.textContent = "play_arrow";
  };
};

const onAudioMetaDataLoaded = (id) => {
  totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
  progressInterval = setInterval(() => {
    if (audio.paused) {
      // clearInterval(progressInterval);

      return;
    }
    songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    songDurationCompleted.textContent = formatTime(audio.currentTime * 1000);
  }, 100);
  onPlayButtonClick(id);
};

const onPlayTrack = ({
  image,
  artistNames,
  previewURL,
  duration,
  name,
  id,
}) => {
  document.querySelector("#now-playing-image").src = image.url;
  document.querySelector("#now-playing-song").textContent = name;
  document.querySelector("#now-playing-artists").textContent = artistNames;

  if (prevTrackSongID !== id) {
    audio.src = previewURL;
    audio.onloadedmetadata = () => {
      onAudioMetaDataLoaded(id);
    };
  } else {
    onPlayButtonClick(id);
  }
};

const loadPlaylistTracks = (songList) => {
  const trackArticle = document.querySelector("#tracks");

  let trackNumber = 1;
  let prevClickID;

  for (let trackItem of songList) {
    let {
      track: {
        id,
        artists,
        name,
        album,
        duration_ms: duration,
        preview_url: previewURL,
      },
    } = trackItem;
    let track = document.createElement("section");
    track.id = id;
    track.className =
      "track grid h-14 grid-cols-[50px_minmax(150px,1fr)_minmax(150px,1fr)_50px] items-center justify-items-start gap-4 rounded-md px-4 text-secondary hover:bg-light-black";
    let image = album.images.find((img) => img.height === 64);
    let artistNames = Array.from(artists, (element) => element.name).join(", ");
    track.innerHTML = `<p class="z-1 relative w-full flex justify-center items-center"><span class="track-no">${trackNumber++}</span></p>
                  <section class="flex items-center gap-4">
                    <img class="h-10 w-10" src=${image.url} alt=${name} />
                    <article>
                      <h2 class="song-name text-base line-clamp-1 text-primary">${name}</h2>
                      <h3 class="text-sm line-clamp-1">${artistNames}</h3>
                    </article>
                  </section>
                  <p class="line-clamp-1">${album.name}</p>
                  <p>${formatTime(duration)}</p>`;
    const playButton = document.createElement("button");
    playButton.id = `play-track${id}`;
    playButton.setAttribute("index", `${trackNumber - 2}`);
    playButton.className = `play w-full absolute left-0 invisible bg-transparent border-0 border-none outline-[0px] material-symbols-outlined`;
    playButton.textContent = "play_arrow";
    playButton.addEventListener("click", (event) => {
      event.stopPropagation();
      currentTrackIndex = parseInt(playButton.getAttribute("index"));
      onPlayTrack({ image, artistNames, previewURL, duration, name, id });
    });
    track.querySelector("p").appendChild(playButton);
    trackArticle.appendChild(track);
    track.addEventListener("click", function (event) {
      track.classList.add("bg-gray", "hover:bg-gray", "selected");

      if (prevClickID && prevClickID !== id) {
        const prevTrack = document.getElementById(prevClickID);
        prevTrack.classList.remove("bg-gray", "hover:bg-gray", "selected");
      }
      prevClickID = id;
    });
  }
};

const numToKMB = (num) => {
  if (num < 1000) {
    return num;
  }
  if (num < 1000000) {
    return `${Math.floor(num / 1000)}K`;
  }
  if (num < 1000000000) {
    return `${Math.floor(num / 1000000)}M`;
  } else {
    return `${Math.floor(num / 1000000000)}B`;
  }
};

const fillContentForPlaylist = async (playlistID) => {
  const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistID}`);
  console.log(playlist);
  songList = playlist.tracks.items.filter((item) => item.track.preview_url);
  numberOfSongs = songList.length;

  const image = playlist.images.find((element) => element.url);
  const imageURL = image.url;
  const coverContent = document.querySelector("#cover-content");
  coverContent.innerHTML = `<article class="grid grid-cols-[auto_1fr] gap-6 ml-4">
  <img class="object-contain h-56 w-56 shadow-[0_4px_60px_rgb(0,0,0,0.5)]" src=${imageURL} alt="" />
  <section class="flex flex-col justify-end gap-1">
    <h1 class="text-4xl font-extrabold mb-4">${playlist.name}  </h1>
    <p class="text-secondary">${playlist.description}</p>
    <section>
    <span>${numberOfSongs} songs •</span>
    <span>${numToKMB(playlist.followers.total)} followers</span>
    </section>
  </section>
</article>`;
  const pageContent = document.querySelector("#page-content");
  pageContent.innerHTML = `
          <header id="playlist-header" class="z-[9] m-[38.5px] mb-4 border-b border-solid border-light-black py-2">
            <nav>
              <ul
                class=" grid grid-cols-[50px_minmax(150px,1fr)_minmax(150px,1fr)_50px] justify-items-start items-center gap-4 px-4 text-secondary"
              >
                <li class="text-lg w-full text-center">#</li>
                <li>TITLE</li>
                <li>ALBUM</li>
                <li>🕒</li>
              </ul>
            </nav>
          </header>
          <article id="tracks" class="px-[38.5px]">
          </article>`;

  loadPlaylistTracks(songList);
};

const loadSection = (section) => {
  if (section.type === SECTIONTYPE.DASHBOARD) {
    skeletonOfDashboardContent();
    loadAllPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    //load the elements for playlist
    fillContentForPlaylist(section.playlist);
  }
  document.querySelector(".content").addEventListener("scroll", (event) => {
    const { scrollTop } = event.target;
    const coverContent = document.querySelector("#cover-content");
    const header = document.querySelector(".header");
    if (scrollTop <= coverContent.offsetHeight) {
      header.style.backgroundColor = `rgba(45,20,58,${
        (scrollTop * 0.5) / 100
      })`;
    }
    const playlistHeader = document.querySelector("#playlist-header");
    if (
      playlistHeader &&
      scrollTop > coverContent.offsetHeight - header.offsetHeight
    ) {
      playlistHeader.style.position = "sticky";
      playlistHeader.style.top = `${header.offsetHeight}px`;
      playlistHeader.classList.remove("m-[38.5px]");
      playlistHeader.classList.add("px-[38.5px]", "bg-black-header");
    } else {
      playlistHeader?.classList.remove("px-[38.5px]", "bg-black-header");
      playlistHeader?.classList.add("m-[38.5px]");
    }
  });
};

const getTrackInfo = (songTrack) => {
  const {
    id,
    artists,
    name,
    album,
    duration_ms: duration,
    preview_url: previewURL,
  } = songTrack.track;
  let image = album.images.find((img) => img.height === 64);
  let artistNames = Array.from(artists, (element) => element.name).join(", ");
  return { image, artistNames, previewURL, duration, name, id };
};

const loadLastPlayedSong = async () => {
  const recentlyPlayed = await fetchRequest(ENDPOINT.recentlyPlayed);
  songList = recentlyPlayed.items.filter((item) => item.track.preview_url);
  currentTrackIndex = -1;
  numberOfSongs = songList.length;
  console.log(recentlyPlayed, songList, numberOfSongs);
  const lastPlayedSong = recentlyPlayed.items.find(
    (element) => element.track.preview_url
  );
  const {
    id,
    artists,
    name,
    album,
    duration_ms: duration,
    preview_url: previewURL,
  } = lastPlayedSong.track;
  let image = album.images.find((img) => img.height === 64);
  let artistNames = Array.from(artists, (element) => element.name).join(", ");
  onPlayTrack({ image, artistNames, previewURL, duration, name, id: false });
  playButton.id = id;
  playButton.addEventListener("click", () => {
    onPlayButtonClick(playButton.id);
  });
  nextButton.addEventListener("click", () => {
    if (currentTrackIndex < numberOfSongs - 1) {
      const trackInfo = getTrackInfo(songList[currentTrackIndex + 1]);
      onPlayTrack(trackInfo);
      currentTrackIndex++;
    }
  });
  prevButton.addEventListener("click", () => {
    if (currentTrackIndex > 0) {
      const trackInfo = getTrackInfo(songList[currentTrackIndex - 1]);
      onPlayTrack(trackInfo);
      currentTrackIndex--;
    }
  });
};

const loadUserPlaylists = async () => {
  const userPlaylists = await fetchRequest(ENDPOINT.userPlaylists);
  console.log(userPlaylists);
  const userPlaylistsSection = document.querySelector("#user-playlists>ul");
  console.log(userPlaylistsSection);

  userPlaylistsSection.innerHTML = "";
  for (let { name, id } of userPlaylists.items) {
    const li = document.createElement("li");
    li.className = "hover:text-primary cursor-pointer";
    li.textContent = name;
    userPlaylistsSection.appendChild(li);
    li.addEventListener("click", (event) => {
      onPlaylistItemClicked(event, id);
    });
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadUserProfile();
  loadUserPlaylists();
  const section = { type: SECTIONTYPE.DASHBOARD };
  // const section = {
  //   type: SECTIONTYPE.PLAYLIST,
  //   playlist: "37i9dQZF1DXcF6B6QPhFDv",
  // };
  // history.pushState(section, "", `playlist/${section.playlist}`);
  history.pushState(section, "", "");
  loadSection(section);
  loadLastPlayedSong();
  document.addEventListener("click", () => {
    const profileMenu = document.querySelector("#profile-menu");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });

  volume.addEventListener("input", () => {
    audio.volume = volume.value / 100;
  });
  const timeline = document.querySelector("#timeline");
  timeline.addEventListener(
    "click",
    (event) => {
      const timelineWidth = window.getComputedStyle(timeline).width;
      const newTime =
        (event.offsetX / parseInt(timelineWidth)) * audio.duration;
      audio.currentTime = newTime;
      songProgress.style.width = `${event.offsetX}px`;
    },
    true
  );
});

window.addEventListener("popstate", (event) => {
  loadSection(event.state);
});
