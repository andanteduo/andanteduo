// contact form ************************************************************

const form = document.getElementById("form");
const result = document.getElementById("result");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const object = Object.fromEntries(formData);
  const json = JSON.stringify(object);
  result.innerHTML = "Please wait...";

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: json,
  })
    .then(async (response) => {
      let json = await response.json();
      if (response.status == 200) {
        result.innerHTML = json.message;
        result.classList.remove("text-gray-500");
        result.classList.add("text-green-500");
      } else {
        console.log(response);
        result.innerHTML = json.message;
        result.classList.remove("text-gray-500");
        result.classList.add("text-red-500");
      }
    })
    .catch((error) => {
      console.log(error);
      result.innerHTML = "Something went wrong!";
    })
    .then(function () {
      form.reset();
      setTimeout(() => {
        result.style.display = "none";
      }, 5000);
    });
});

// calendar ******************************************************************************************
async function getData() {
  try {
    const calendarId =
      "057b6f9a7cd766c8f662565f303a9e0b9db8df6c3dc51f2432dd38cc73f15fdf@group.calendar.google.com";
    const myKey = "AIzaSyCvFYUkBnr1x7HjcjI9chI-8np2K0iisF4";
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${myKey}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const eventsByYear = {};

      // Group events by year
      data.items.forEach((event) => {
        const startDate = new Date(event.start.dateTime);
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + 1; // Month is zero-indexed, so add 1

        if (!eventsByYear[year]) {
          eventsByYear[year] = {};
        }
        if (!eventsByYear[year][month]) {
          eventsByYear[year][month] = [];
        }
        eventsByYear[year][month].push(event);
      });

      // Get the container element
      const container = document.getElementById("accordionEvents");
      const nextEventContainer = document.getElementById("nextEvent");
      const bannerNextEventContainer =
        document.getElementById("banner-nextEvent");

      let nextEventSet = false;
      // Output events by year and month, filtering out past months
      Object.entries(eventsByYear).forEach(([year, eventsByMonth]) => {
        // Create an h3 tag for the year
        const yearHeader = document.createElement("h3");
        yearHeader.textContent = year;
        container.appendChild(yearHeader);

        // Create accordion element for the year
        const accordion = document.createElement("div");
        accordion.classList.add("accordion", "mb-5");

        // Get the current date
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // Month is zero-indexed, so add 1

        // Loop through each month in the year
        for (let month = 1; month <= 12; month++) {
          // Check if the month has events and is not in the past
          if (
            eventsByMonth[month] &&
            eventsByMonth[month].length > 0 &&
            (year > currentYear ||
              (year == currentYear && month >= currentMonth))
          ) {
            // Create accordion item for the month
            const accordionItem = document.createElement("div");
            accordionItem.classList.add("accordion-item");

            // Create accordion header
            const accordionHeader = document.createElement("h2");
            accordionHeader.classList.add("accordion-header");
            const dateFormatter = new Intl.DateTimeFormat("en-US", {
              month: "long",
            });
            const formattedMonth = dateFormatter.format(
              new Date(year, month - 1, 1)
            );
            accordionHeader.innerHTML = `
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${year}${month}" aria-expanded="false" aria-controls="collapse${year}${month}">
                ${formattedMonth}
              </button>
            `;

            // Create accordion collapse container
            const accordionCollapse = document.createElement("div");
            accordionCollapse.id = `collapse${year}${month}`;
            accordionCollapse.classList.add("accordion-collapse", "collapse");
            accordionCollapse.setAttribute(
              "aria-labelledby",
              `heading${year}${month}`
            );

            // Create accordion body
            const accordionBody = document.createElement("div");
            accordionBody.classList.add("accordion-body");

            // Sort events by start date
            eventsByMonth[month].sort((a, b) => {
              return new Date(a.start.dateTime) - new Date(b.start.dateTime);
            });

            // Add events as list items
            eventsByMonth[month].forEach((event) => {
              const startDate = formatDate(
                new Date(event.start.dateTime),
                currentDate
              );
              const isExpired = new Date(event.start.dateTime) < currentDate;
              if (!isExpired && !nextEventSet) {
                
                const nextEventHTML = `
                  <h3 class="header-countdown"><div id="banner-nextEvent-countdown" class="next-event-countdown"></div></h3>
                  <h3 class="header">Next Show</h3>
                  <div class="next-event-item">
                    <div class="event-item-content">
                      <div class="event-title">${event.summary}</div>
                      <div class="event-date">${startDate}</div>
                      <div class="event-location">${event.location}</div>
                    </div>
                  </div>
                `;
                nextEventSet = true;
                nextEventContainer.innerHTML = nextEventHTML;
                bannerNextEventContainer.innerHTML = nextEventHTML;
                updateCountdown(event.start.dateTime);
                setInterval(() => updateCountdown(event.start.dateTime), 60000);
              }
              const eventHtml = `
                <div class="event-item ${isExpired ? "expired" : ""}">
                  <div class="event-item-content">
                    <div class="event-title">${event.summary}</div>
                    <div class="event-date">${startDate}</div>
                    <div class="event-location">${event.location}</div>
                  </div>
                  <div class="event-links">
                    <div class="map-link">
                      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURI(
                      event.location
                      )}" target="_blank" title="Show on map"><i class="fa-solid fa-location-dot"></i></a>
                    </div>
                  </div>
                </div>
              `;
              accordionBody.innerHTML += eventHtml;
            });

            // Append accordion header, body, and collapse container
            accordionCollapse.appendChild(accordionBody);
            accordionItem.appendChild(accordionHeader);
            accordionItem.appendChild(accordionCollapse);

            // Append accordion item to the accordion
            accordion.appendChild(accordionItem);
          }
        }

        // Append the accordion to the container if it contains items
        if (accordion.childElementCount > 0) {
          container.appendChild(accordion);
        }
      });
    } else {
      console.log("No events found.");
    }
  } catch (error) {
    console.log("Error fetching calendar events:", error);
  }
}

function formatDate(date, currentDate) {
  const optionsDate = {
    // day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "numeric",
  };
  const optionsDay = { weekday: "long" };
  const formattedDate = date.toLocaleDateString("en-GB", optionsDate);
  const day = date.toLocaleDateString("en-GB", optionsDay);

  let suffix = "th";
  const dayOfMonth = date.getDate();
  if (dayOfMonth === 1 || dayOfMonth === 21 || dayOfMonth === 31) {
    suffix = "st";
  } else if (dayOfMonth === 2 || dayOfMonth === 22) {
    suffix = "nd";
  } else if (dayOfMonth === 3 || dayOfMonth === 23) {
    suffix = "rd";
  }

  // Construct the formatted date string
  const formattedDay = day.charAt(0).toUpperCase() + day.slice(1); // Capitalize the first letter
  return `${formattedDay}, ${dayOfMonth}${suffix} ${formattedDate}`;
}

function updateCountdown(startDate) {
  console.log('updating..');
  const targetDate = new Date(startDate);
  const now = new Date();
  const difference = targetDate - now;

  if (difference > 0) {
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const daysLabel = days == 1 ? `day` : `days`;
    const daysOutput =
      days > 0
        ? `<span class="highlight">${days}</span> <span class="label">${daysLabel}</span> &nbsp;`
        : "";
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const hoursLabel = hours == 1 ? `hour` : `hours`;
    const hoursOutput =
      hours > 0
        ? `<span class="highlight">${hours}</span> <span class="label">${hoursLabel}</span> &nbsp;`
        : "";
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const minutesLabel = minutes == 1 ? `minute` : `minutes`;
    const minutesOutput =
      minutes > 0
        ? `<span class="highlight">${minutes}</span> <span class="label">${minutesLabel}</span>`
        : "";

    let output = '';

    if (days > 0) {
      output = `Next show in <div>${daysOutput} ${hoursOutput} ${minutesOutput}</div>`;
    } else {
      output = `Next show today in <div>${hoursOutput} ${minutesOutput}</div>`;
    }
    document.getElementById(
      "banner-nextEvent-countdown"
    ).innerHTML = output;
  }
}

getData();

// scroll *******************************************************************************************
let scrollpos = window.scrollY;
const header = document.querySelector(".navbar-brand");
const navbar = document.querySelector("nav.navbar");
const dropdown = document.querySelector("navbar-collapse");

window.addEventListener("scroll", function () {
  scrollpos = window.scrollY;
  if (scrollpos >= 300) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
  if (scrollpos >= 200) {
    navbar.classList.add("active");
  } else {
    navbar.classList.remove("active");
  }
});

// $(function () {
//   $('.nav-link').on('click', function (event) {
//     event.preventDefault();
//     $(".navbar-collapse").collapse("hide");
//     $("html, body").animate(
//       {
//         scrollTop: $("#band").offset().top - 80,
//       },
//       1000
//     );
//   });
// });

const menuItems = document.querySelectorAll(".nav-link");

// Loop through each menu item and attach click event listener
menuItems.forEach(function (menuItem) {
  menuItem.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default link behavior
    const targetId = this.getAttribute("href").substring(1); // Get target section id
    const targetSection = document.getElementById(targetId);
    let offset = 90;
    if (targetId == "about") {
      offset = 40;
    }
    const scrollPosition = targetSection.offsetTop - offset;
    window.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    });

    const navbarCollapses = document.querySelectorAll(".navbar-collapse");

    // Iterate over each element and remove the "show" class
    navbarCollapses.forEach(function (navbarCollapse) {
      navbarCollapse.classList.remove("show");
    });
  });
});

// gallery
// const imageWrapper = document.querySelector(".images");
// const images = document.querySelectorAll(".images img");
// const overlay = document.getElementById("overlay");
// var overlayImage = overlay.querySelector("img");
// images.forEach(function (image) {
//   image.addEventListener("click", function (event) {
//     const target = this.getAttribute("src");
//     overlayImage.setAttribute("src", target);
//     overlay.classList.add("active");
//     imageWrapper.classList.add("dark");
//   });
// });

// overlay.addEventListener("click", function (event) {
//   overlay.classList.remove("active");
//   imageWrapper.classList.remove("dark");
// });

// audio
$(function () {
  var playerTrack = $("#player-track"),
    bgArtwork = $("#bg-artwork"),
    bgArtworkUrl,
    trackName = $("#track-name"),
    artistName = $("#artist-name"),
    albumArt = $("#album-art"),
    sArea = $("#s-area"),
    seekBar = $("#seek-bar"),
    trackTime = $("#track-time"),
    bufferText = $("#buffer-box"),
    insTime = $("#ins-time"),
    sHover = $("#s-hover"),
    playPauseButton = $("#play-pause-button"),
    prevButton = $("#play-previous"),
    nextButton = $("#play-next"),
    i = playPauseButton.find("i"),
    tProgress = $("#current-time"),
    tTime = $("#track-length"),
    seekT,
    seekLoc,
    seekBarPos,
    cM,
    ctMinutes,
    ctSeconds,
    curMinutes,
    curSeconds,
    durMinutes,
    durSeconds,
    playProgress,
    bTime,
    nTime = 0,
    buffInterval = null,
    tFlag = false,
    tracks = [
      "Heaven",
      "Hallelujah",
      // "Castle on the Hill",
      // "When Tomorrow Comes",
      "Still the One",
      // "Go Your Own Way",
    ],
    artistNames = [
      "Bryan Adams",
      "Leonard Cohen",
      // "Ed Sheeran",
      // "Eurythmics",
      "Shania Twain",
      // "Fleetwood Mac",
    ],
    albumArtworks = [
      "_1",
      "_2",
      // "_3", "_4",
      "_5",
      // "_6",
    ],
    trackUrl = [
      "https://andanteduo.github.io/andanteduo/audio/Heaven.mp3",
      "https://andanteduo.github.io/andanteduo/Hallelujah.mp3",
      "https://andanteduo.github.io/andanteduo/Still the One.mp3",
      // "https://hottinruth.com/audio/Who Knew.mp3",
      // "https://hottinruth.com/audio/Who Knew.mp3",
      // "https://hottinruth.com/audio/Who Knew.mp3",
    ],
    playPreviousTrackButton = $("#play-previous"),
    playNextTrackButton = $("#play-next"),
    currIndex = -1;

  function playPause() {
    setTimeout(function () {
      if (audio.paused) {
        playerTrack.addClass("active");
        albumArt.addClass("active");
        checkBuffering();
        i.attr("class", "fas fa-pause");
        audio.play();
      } else {
        playerTrack.removeClass("active");
        albumArt.removeClass("active");
        clearInterval(buffInterval);
        bufferText.removeClass("active");
        albumArt.removeClass("buffering");
        i.attr("class", "fas fa-play");
        audio.pause();
      }
    }, 300);
  }

  function showHover(event) {
    seekBarPos = sArea.offset();
    seekT = event.clientX - seekBarPos.left;
    seekLoc = audio.duration * (seekT / sArea.outerWidth());

    sHover.width(seekT);

    cM = seekLoc / 60;

    ctMinutes = Math.floor(cM);
    ctSeconds = Math.floor(seekLoc - ctMinutes * 60);

    if (ctMinutes < 0 || ctSeconds < 0) return;

    if (ctMinutes < 0 || ctSeconds < 0) return;

    if (ctMinutes < 10) ctMinutes = "0" + ctMinutes;
    if (ctSeconds < 10) ctSeconds = "0" + ctSeconds;

    if (isNaN(ctMinutes) || isNaN(ctSeconds)) insTime.text("--:--");
    else insTime.text(ctMinutes + ":" + ctSeconds);

    insTime.css({ left: seekT, "margin-left": "-21px" }).fadeIn(0);
  }

  function hideHover() {
    sHover.width(0);
    insTime.text("00:00").css({ left: "0px", "margin-left": "0px" }).fadeOut(0);
  }

  function playFromClickedPos() {
    audio.currentTime = seekLoc;
    seekBar.width(seekT);
    hideHover();
  }

  function updateCurrTime() {
    nTime = new Date();
    nTime = nTime.getTime();

    if (!tFlag) {
      tFlag = true;
      trackTime.addClass("active");
    }

    curMinutes = Math.floor(audio.currentTime / 60);
    curSeconds = Math.floor(audio.currentTime - curMinutes * 60);

    durMinutes = Math.floor(audio.duration / 60);
    durSeconds = Math.floor(audio.duration - durMinutes * 60);

    playProgress = (audio.currentTime / audio.duration) * 100;

    if (curMinutes < 10) curMinutes = "0" + curMinutes;
    if (curSeconds < 10) curSeconds = "0" + curSeconds;

    if (durMinutes < 10) durMinutes = "0" + durMinutes;
    if (durSeconds < 10) durSeconds = "0" + durSeconds;

    if (isNaN(curMinutes) || isNaN(curSeconds)) tProgress.text("00:00");
    else tProgress.text(curMinutes + ":" + curSeconds);

    if (isNaN(durMinutes) || isNaN(durSeconds)) tTime.text("00:00");
    else tTime.text(durMinutes + ":" + durSeconds);

    if (
      isNaN(curMinutes) ||
      isNaN(curSeconds) ||
      isNaN(durMinutes) ||
      isNaN(durSeconds)
    )
      trackTime.removeClass("active");
    else trackTime.addClass("active");

    seekBar.width(playProgress + "%");

    if (playProgress == 100) {
      i.attr("class", "fa fa-play");
      seekBar.width(0);
      tProgress.text("00:00");
      bufferText.removeClass("active").removeClass("active");
      albumArt.removeClass("buffering").removeClass("active");
      playerTrack.removeClass("active");
      clearInterval(buffInterval);
      selectTrack(1);
    }
  }

  function checkBuffering() {
    clearInterval(buffInterval);
    buffInterval = setInterval(function () {
      if (nTime == 0 || bTime - nTime > 1000) {
        bufferText.addClass("active");
        albumArt.addClass("buffering");
      } else {
        bufferText.removeClass("active");
        albumArt.removeClass("buffering");
      }

      bTime = new Date();
      bTime = bTime.getTime();
    }, 100);
  }

  function selectTrack(flag) {
    if (flag == 0 || flag == 1) {
      ++currIndex;
    } else {
      --currIndex;
    }

    if (currIndex <= 0) {
      prevButton.addClass("disabled");
    } else {
      prevButton.removeClass("disabled");
    }
    if (currIndex >= albumArtworks.length - 1) {
      nextButton.addClass("disabled");
    } else {
      nextButton.removeClass("disabled");
    }

    if (currIndex > -1 && currIndex < albumArtworks.length) {
      if (flag == 0) i.attr("class", "fa fa-play");
      else {
        bufferText.removeClass("active");
        albumArt.removeClass("buffering");
        i.attr("class", "fa fa-pause");
      }

      seekBar.width(0);
      trackTime.removeClass("active");
      tProgress.text("00:00");
      tTime.text("00:00");

      currTrack = tracks[currIndex];
      currArtistName = artistNames[currIndex];
      currArtwork = albumArtworks[currIndex];

      audio.src = trackUrl[currIndex];

      nTime = 0;
      bTime = new Date();
      bTime = bTime.getTime();

      if (flag != 0) {
        audio.play();
        playerTrack.addClass("active");
        albumArt.addClass("active");

        clearInterval(buffInterval);
        checkBuffering();
      }

      trackName.text(currTrack);
      artistName.text(currArtistName);
      albumArt.find("img.active").removeClass("active");
      $("#" + currArtwork).addClass("active");

      bgArtworkUrl = $("#" + currArtwork).attr("src");

      bgArtwork.css({ "background-image": "url(" + bgArtworkUrl + ")" });
    } else {
      if (flag == 0 || flag == 1) {
        --currIndex;
      } else {
        ++currIndex;
      }
    }
  }

  function initPlayer() {
    audio = new Audio();

    selectTrack(0);

    audio.loop = false;

    playPauseButton.on("click", playPause);

    sArea.mousemove(function (event) {
      showHover(event);
    });

    sArea.mouseout(hideHover);

    sArea.on("click", playFromClickedPos);

    $(audio).on("timeupdate", updateCurrTime);

    playPreviousTrackButton.on("click", function () {
      selectTrack(-1);
    });
    playNextTrackButton.on("click", function () {
      selectTrack(1);
    });
  }

  initPlayer();
});
