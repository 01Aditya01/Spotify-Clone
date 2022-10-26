import { fetchRequest } from "../api";
import { ENDPOINT, logout, SECTIONTYPE } from "../common";

const loadUserProfile = async () => {
  const defaultImage = document.querySelector("#default-image");
  const profileButton = document.querySelector("#user-profile-btn");
  const displayNameElement = document.querySelector("#display-name");

  const onProfileClick = (event) => {
    event.stopPropagation();
    const profileMenu = document.querySelector("#profile-menu");
    profileMenu.classList.toggle("hidden");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.querySelector("li#logout").addEventListener("click", logout);
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

const onPlaylistItemClicked = (event, id) => {
  // console.log(event.currentTarget);
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

const loadPlaylistTracks = ({ tracks }) => {
  const trackArticle = document.querySelector("#tracks");

  let trackNumber = 1;
  for (let trackItem of tracks.items) {
    let {
      track: { id, artists, name, album, duration_ms: duration },
    } = trackItem;
    let track = document.createElement("section");
    track.className =
      "track m-[auto] grid h-14 w-[93%] grid-cols-[50px_2fr_1fr_50px] items-center justify-items-start gap-4 rounded-md px-4 text-secondary hover:bg-light-black";
    let image = album.images.find((img) => img.height === 64);

    track.innerHTML = `<p>${trackNumber++}</p>
                  <section class="flex items-center gap-4">
                    <img class="h-10 w-10" src=${image.url} alt=${name} />
                    <article>
                      <h2 class="text-base text-primary">${name}</h2>
                      <h3 class="text-sm">${Array.from(
                        artists,
                        (element) => element.name
                      ).join(", ")}</h3>
                    </article>
                  </section>
                  <p>${album.name}</p>
                  <p>${formatTime(duration)}</p>`;
    trackArticle.appendChild(track);
  }
};

const fillContentForPlaylist = async (playlistID) => {
  const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistID}`);
  console.log(playlist);
  const pageContent = document.querySelector("#page-content");
  pageContent.innerHTML = `
          <header class="sticky top-[72px] mb-4 border-b border-solid border-light-black bg-black-primary py-2">
            <nav>
              <ul
                class="m-[auto] grid w-[93%] grid-cols-[50px_2fr_1fr_50px] gap-4 px-4 text-secondary"
              >
                <li class="text-lg">#</li>
                <li>TITLE</li>
                <li>ALBUM</li>
                <li>🕒</li>
              </ul>
            </nav>
          </header>
          <article id="tracks">
          </article>`;

  loadPlaylistTracks(playlist);
};

const loadSection = (section) => {
  if (section.type === SECTIONTYPE.DASHBOARD) {
    skeletonOfDashboardContent();
    loadAllPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    //load the elements for playlist
    fillContentForPlaylist(section.playlist);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();
  const section = { type: SECTIONTYPE.DASHBOARD };
  history.pushState(section, "", "");
  loadSection(section);
  document.addEventListener("click", () => {
    const profileMenu = document.querySelector("#profile-menu");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });
  document.querySelector(".content").addEventListener("scroll", (event) => {
    const { scrollTop } = event.target;
    const coverContent = document.querySelector("#cover-content");
    const header = document.querySelector(".header");
    if (scrollTop <= coverContent.offsetHeight) {
      header.style.backgroundColor = `rgba(45,20,58,${
        (scrollTop * 0.5) / 100
      })`;
      // coverContent.style.ba;
      // header.classList.remove(`bg-violet-dark`);
      // header.classList.add(`bg-violet-dark/${scrollTop * 0.5}`);
    }
  });
  window.addEventListener("popstate", (event) => {
    loadSection(event.state);
  });
});
