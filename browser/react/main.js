'use strict';

import axios from 'axios';
import React from 'react';

import Sidebar from './sidebar.js';
import Player from './player.js';
import Albums from './albums.js';
import SingleAlbum from './singleAlbum.js';

const audio = document.createElement('audio');
// audio.setAttribute("preload", "auto");
// audio.setAttribute("autoplay", true);

export default class Main extends React.Component {

  constructor(props){
    super(props);

    this.state = {
      library: [],
      selectedAlbum: {},
      currentSong: {},
      currentSongsAlbum: {},
      isPlaying: false,
      progress: 0
    };

    this.handleClick = this.handleClick.bind(this);
    this.getAllAlbums = this.getAllAlbums.bind(this);
    this.playSong = this.playSong.bind(this);
    this.toggleSong = this.toggleSong.bind(this);
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
    this.stop = this.stop.bind(this);
    this.autoNext = this.autoNext.bind(this);
  }

  componentDidMount() {
    axios.get('api/albums')
    .then(albums => albums.data)
    .then(libraryFromServer => {
      libraryFromServer = libraryFromServer.map(library => {
        library.imageUrl = `/api/albums/${library.id}/image`;
        return library;
      });
      this.setState({ library: libraryFromServer });
    })
    .catch(console.error.bind(console));

    // Trying to get left and right keys to work.
    // document.body.addEventListener("keyup", (event) => {
    // 	console.log(event);
    // 	if (event.code === 'ArrowRight') this.next();
    // 	else if (event.code === 'ArrowLeft') this.prev();
    // });

    audio.addEventListener('ended', () => this.autoNext());

    audio.addEventListener('timeupdate', () => {
      this.setState({
        progress: 100 * audio.currentTime / audio.duration
      });
    });
  }

  handleClick(albumId){
    axios.get(`api/albums/${albumId}`)
    .then(res => res.data)
    .then(album => {
      album.imageUrl = `/api/albums/${album.id}/image`;
      this.setState({ selectedAlbum: album });
    })
    .catch(console.error.bind(console));
  }

  getAllAlbums() {
    this.setState({ selectedAlbum: {} });
  }

  playSong(song) {
    audio.src = song.url;
    audio.load();
    audio.play();
    // console.log(audio.paused, audio.duration);
  }

  toggleSong(song) {
    if (song.id === this.state.currentSong.id) {
      this.state.isPlaying ? audio.pause() : audio.play();
      this.setState((prevState) => ({ isPlaying: !prevState.isPlaying }));
    }
    else {
      this.setState({
        currentSongsAlbum: this.state.selectedAlbum,
        currentSong: song,
        isPlaying: true
      });
      this.playSong(song);
    }
  }

  autoNext() {
    const songs = this.state.currentSongsAlbum.songs;
    let songToPlay;
    songs.forEach((song, i) => {
      if (song.id === this.state.currentSong.id) {
        if (songs[i + 1]) songToPlay = songs[i + 1];
        else songToPlay = songs[0];
      }
    });
    this.setState({ currentSong: songToPlay });
    this.playSong(songToPlay);
  }

  next() {
    const songs = this.state.currentSongsAlbum.songs;
    songs.forEach((song, i) => {
      if (song.id === this.state.currentSong.id) {
        if (songs[i + 1]) this.toggleSong(songs[i + 1]);
        else this.toggleSong(songs[0]);
      }
    });
  }

  prev() {
    const songs = this.state.currentSongsAlbum.songs;
    songs.forEach((song, i) => {
      if (song.id === this.state.currentSong.id) {
        if (songs[i - 1]) this.toggleSong(songs[i - 1]);
        else this.toggleSong(songs[songs.length - 1]);
      }
    });
  }

  stop() {
    audio.pause();
    audio.currentTime = 0;
    this.setState({
      currentSong: {},
      currentSongsAlbum: {},
      isPlaying: false
    });
  }

  render() {
    return (
      <div id="main" className="container-fluid">
        <div className="col-xs-2">
          <Sidebar getAllAlbums={ this.getAllAlbums } />
        </div>

        <div className="col-xs-10" >
          {
            this.state.selectedAlbum.id
            ?
            <SingleAlbum audio={ audio } album={ this.state.selectedAlbum } toggleSong={ this.toggleSong } currentSong={ this.state.currentSong } isPlaying={ this.state.isPlaying } />
            :
            <Albums albums={ this.state.library } clickHandler={ this.handleClick } />
          }
        </div>

        <Player currentSong={ this.state.currentSong } toggleSong={ this.toggleSong } next={ this.next } prev={ this.prev } stop={ this.stop } isPlaying={ this.state.isPlaying } progress={ this.state.progress } />

      </div>
    );
  }
}
