/*
1.Render song ->ok (bao gồm lấy ra bài hát đầu tiên trong list)
2.Scroll top -> ok
3.Play /pause/ seek ->ok
4.CD rotate ->ok
5.Next / previous ->ok
6.Random (next và previous)->ok
7.Next / repeat  when ended ->ok
8.Active song ->ok
9.Scroll active song into view ->ok
10.Play song when click ->ok
*/
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = 'F8_PLAYER';

const heading = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');
const playBtn = $('.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');
const nextBtn = $('.btn-next');
const prevBtn = $('.btn-prev');
const randomBtn = $('.btn-random');
const repeatBtn = $('.btn-repeat');
const playList = $('.playlist');
const app = {
    currentIndex: 0,
    isPlaying : false,
    isRandom : false,
    isRepeat: false,
//dùng để lưu lại cấu hình khi ta reload lại trang, ví dụ như random
//hay lặp lại bài hát khi ta F5 thì nó vẫn lưu lại
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    setConfig: function(key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
    },
/*Hàm setConfig này là lưu lại cấu hình trên khi random hoặc lặp lại nên
ta chỉ thêm hàm này vào trong random hoặc repeat thôi */
    songs: [
        {
            name: 'Kiếp má hồng',
            singer: 'TLong',
            path: './asset/song/Kiep-Ma-Hong-Lofi-TLong-x-Quanvrox.mp3',
            image: './asset/img/kiếp má hồng.jpg'
        },
        {
            name: 'Sai người sai thời điểm',
            singer: 'Thanh Hưng',
            path: './asset/song/TaiNhacHay.Biz - Sai Người Sai Thời Điểm.mp3',
            image: './asset/img/sai người sai thời điểm.jpg'
        },
        {
            name: 'Có duyên không nợ remix',
            singer: 'Hoài Bảo',
            path: './asset/song/Co-Duyen-Khong-No-Remix-NB3-Hoai-Bao-Orinn-Remix.mp3',
            image: './asset/img/có duyên không nợ.jpg'
        },
        {
            name: 'Thuyền quyên',
            singer: 'Diệu Kiên, CaoTri',
            path: './asset/song/ThuyenQuyenLofiVer-DieuKienCaoTri-8520916.mp3',
            image: './asset/img/thuyền quyên.jpg'
        },
        {
            name: 'Anh vẫn ở đây',
            singer: 'Thành Đạt',
            path: './asset/song/AnhVanODayLofiVersion-ThanhDat-7584196.mp3',
            image: './asset/img/anh vẫn ở đây.jpg'
        },
        {
            name: 'Áo cũ tình em',
            singer: 'Thương Võ',
            path: './asset/song/AoCuTinhEmLofiVersion-ThuongVo-7582048.mp3',
            image: './asset/img/áo cũ tình em.jpg'
        }
    ],
//Hàm này dùng để bổ sung thuộc tính của app, nghĩa là ta sẽ tạo 1 thuộc tính
//mới giống như currenIndex, mà khi ta gọi nó ko cần trả về hàm.
    defineProperties: function () {
        Object.defineProperty(this,'currentSong', {
            
            //value : this.songs[this.currentIndex]
//không dùng giá trị như trên được vì nó ko return về giá trị khi ta 
//cần next sang bài tiếp theo, bởi vì nó không trả về giá trị nên 
//nó sẽ là undefined.
            
//Anh sơn đặt thế này
                get: function () {
                    return this.songs[this.currentIndex]; 
                    //hàm trên bằng với app.songs[app.currentIndex]
                    // = app.songs[0];
//Từ this ở đây có nghĩa là app chứ không phải là get, nghĩa là khi ta gọi 
//hàm defineProperties này thì thuộc tính currentSong sẽ được thêm vào app
//bằng phương thức Object.defineProperty nghĩa là bây giờ currentSong ngang
//cấp với defineProperty, muốn gọi nó phải là app.currentSong nên đấy là
//giải thích tại sao this ở đây bằng app.
                }
               
        })
    },
//1.Render song
    render: function () {
        const htmls = this.songs.map((song,index) => {
/*Khi thêm ${index === this.currentIndex ? 'active':''} có nghĩa là ta 
thêm class active khi mà bài hát nào đó đang chạy
Thêm data-index là thêm attribute vào element để phục vụ cho việc lấy index*/
            return `
            <div class="song ${index === this.currentIndex ? 'active':''}" data-index = "${index}" >
                <div class="thumb"
                    style="background-image: url('${song.image}')">
                </div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>  
            `
        })
        playList.innerHTML = htmls.join('');
/*8.Active song: ${index === this.currentIndex ? 'active':'' hàm này ở trên 
dùng để thêm class active vào bài hát nào đang chạy, cứ có class này sẽ có
màu tại ta đã thêm nó ở CSS.
Nếu ban đầu chỉ gọi hàm này mà ko dùng hàm render trong hàm next hoặc hàm
previous thì nếu nó chuyển bài hát nó sẽ ko thêm được class active. Tại sao?
Bởi vì ban đầu currentIndex = 0 có nghĩa là nó chỉ thêm class active ở bài
đầu tiên. Khi ta ấn next, hoặc prev hoặc random khi ended thì currentIndex
đã thay đổi nhờ currentIndex++, currentIndex--, currentIndex = newIndex
nhưng ko gọi lại hàm render này thì currentIndex ở trong hàm này vẫn là 0
nên ta phải gọi lại hàm này trong next, prev, random thì nó mới cập nhật
được currentIndex từ đó thêm được class active 
Tại sao trong hàm playRandomSong ta lại ko gọi lại hàm render nhưng nó
vẫn thêm được class active? Thứ nhất khi bài hát kết thúc, ta có thể lặp lại
hoặc nó sẽ tự động ấn next, mà trong next lại có hàm random nên nó sẽ được 
thêm class active.Vậy nên ta chỉ cần gọi hàm render trong next và prev thôi*/

    },
    handleEvents: function(){
        const cd = $('.cd');
        //console.log({cd});
        // console.log([cd]);
//Để xem tất cả các thuộc tính của biến cd (element có class là cd) thì ta có 
// thể đưa vào mảng [] hoặc là object {} sẽ tìm thấy có thuộc tính là offsetWidth
// để lấy chiều rộng của element này vì ở đây nó là hình vuông nên lấy chiều
//rộng hay chiều cao là như nhau. Khi lấy chiều cao hay chiều rộng của element
// cần phân biệt offsetWidth và clientWidth. offsetWidth thì bào gồm tất cả kích
// thước toàn bộ phần tử bao gồm content, padding, border, thanh cuộn (nếu có). 
// Còn clientWidth thì bao gồm content, padding , ko tính border và scroll(thanh
// cuộn) 

        const cdWidth = cd.offsetWidth; //Lấy chiều cao của element cd.

//4.CD rotate (Xử lý CD quay / dừng)
        const cdThumbAnimate = cdThumb.animate(
            {transform: 'rotate(360deg)'}
        ,{
            duration :10000, //quay trong 10s nghĩa là 10s quay 1 vòng
            iterations: Infinity // quay vô hạn
        })
/*element.animate(keyframes, options); đây là phương thức của animate trong JS.
element là cái phần tử ta cần thực hiện chuyển động, keyframes là một mảng 
các khung hình (keyframes) của hiệu ứng chuyển động. Mỗi khung hình được đại 
diện bởi một đối tượng JavaScript, chứa các thuộc tính CSS và giá trị của 
chúng tại thời điểm tương ứng trong hiệu ứng.options là một đối tượng 
JavaScript, chứa các tùy chọn của hiệu ứng, chẳng hạn như thời gian thực 
hiện, hình thức lặp lại, hàm hoàn thành và nhiều hơn nữa */
        cdThumbAnimate.pause();
//Phải đặt thuộc tính trên bởi nếu ko đặt thì khi ta ko ấn play nhạc thì
//nó vẫn quay, nó chỉ quay khi ta bật nhạc thôi

//2.Xử lý phóng to thu nhỏ cd của ta (hay là scroll top)
        document.onscroll = function(){
            const scrollTop = document.documentElement.scrollTop || window.scrollY;
//Vì ta lấy document nên nó sẽ tính khi ta cuộn cả trang web là bao nhiêu theo
//từ trên xuống nó sẽ trả về. Nhớ là document.documentElement còn muốn trả
//về giá trị của một thẻ hay một class thì ta dùng document.querySelector()
//window.scrollY gần giống như document.documentElement.scrollTop, nên biết
//nhiều cách cho đa dạng

            const newCdWidth = cdWidth - scrollTop;
//Nay là để tính chiều cao của cd khi ta trượt con chuột  

            cd.style.width =newCdWidth >0 ? newCdWidth + 'px' : 0;
            cd.style.opacity = newCdWidth / cdWidth;
//Vì độ mờ là 1 số nhở hơn 1 nên ta dùng như vậy để tính tỉ lệ
        }

//3.Xử lý khi click play (Play/pause)
        const _this = this;
        playBtn.onclick = function(){

            // if(_this.isPlaying){
            //     audio.pause();
            //     player.classList.remove("playing");
            //     _this.isPlaying = false;
            // } else {
            //     audio.play();
            //     player.classList.add("playing");
            //     _this.isPlaying = true;
//this.isPlaying = true;
//Ở trên nếu dùng this này thì sẽ bị lỗi vì sao? vì this ở đây nó ko trỏ 
//đến app mà nó trỏ đến playBtn, tại vì nó nằm bên trong 1 phương thức 
//khác
            // }
//Câu lệnh trên này là tư duy logic của chúng ta thôi, thực tế nên làm thế này
            if(_this.isPlaying){
                audio.pause();    
//Này là phương thức của audio/video nghĩa là tắt. Nếu _this.isPlaying mà đúng
//thì khi ta click vào nó sẽ tắt nhạc
            } else {
                audio.play();  
//Này là phương thức của audio/video nghĩa là bật
            }
//Này là khi ta ấn bật khi mà video đang tắt thì nó sẽ thực hiện khối lệnh này
            audio.onplay = function(){
                _this.isPlaying = true;
//Thêm class này để đổi icon             
                player.classList.add("playing");
//Khi ta bật nhạc thì hàm này sẽ bắt đầu chạy, đó là quay đĩa cd               
                cdThumbAnimate.play();
            };
//Này là khi ta ấn tắt khi mà video đang bật thì nó sẽ thực hiện khối lệnh này
            audio.onpause = function(){
                _this.isPlaying = false;
//Xóa class này để về trạng thái ban đầu
                player.classList.remove("playing");

                cdThumbAnimate.pause();
            }; 
//Hàm này là thay đổi tiến độ khi bài hát đang chạy
            audio.ontimeupdate = function(){
                const progressPercent = Math.floor(audio.currentTime / audio.duration *100);
/*currentTime là thuộc tính trả về độ dài của bài hát lúc hát hiện tại tính 
bằng s còn duration trả về độ dài của cả bài hát. Công thức trên là tính %
tiến độ của bài hát*/         
                progress.value = progressPercent;
//Cái value này là trỏ đến value trong element có id là progress để thay 
//đổi giá trị value của nó, nó sẽ tự động di chuyển khi bài hát chạy
            };

//3.Seek bài hát (Xử lý khi tua nhanh hay tua chậm). Anh Sơn đặt thế này
//             progress.oninput = function(e){
//                 const seekTime = audio.duration /100 *e.target.value;
// /*công thức này dùng để tính thời gian của bài hát khi ta đã có giá trị %
// hay giá trị của thanh progress. Ta có công thức sau: %đã hát = (thời gian
// bài hát hiện tại / tổng thời gian bài hát) *100% => thời gian bài hát hiện
// tại bằng công thức trên. */    
//                 audio.currentTime = seekTime;
//             };
        },

//3.Seek bài hát (Xử lý khi tua nhanh hay tua chậm) này tôi đặt
       progress.oninput = function(e){
            const seekTime = audio.duration /100 *e.target.value;
/*công thức này dùng để tính thời gian của bài hát khi ta đã có giá trị %
hay giá trị của thanh progress. Ta có công thức sau: %đã hát = (thời gian
bài hát hiện tại / tổng thời gian bài hát) *100% => thời gian bài hát hiện
tại bằng công thức trên. */    
            audio.currentTime = seekTime;
        };
/*Nếu như đặt theo anh sơn có nghĩa là khi ta ko click vào nút chơi thì 
vẫn được phép điều chỉnh thanh progress nhưng khi ta click vào nút chơi
rồi thì bài hát sẽ hát lại từ đầu, ko hát ngay tại vị trí ta chọn trên
thanh progress, cái này chỉ áp dụng cho lần đầu reload thôi. 
Còn đặt như tôi thì khi ta ấn trên thanh progress trước sau đó ấn play thì
nó sẽ hát ngay tại chỗ ấn trên thanh progress*/


// 5.Next song (Xử lý khi ấn next song)
        nextBtn.onclick = function(){
            
            if(_this.isRandom){
                _this.playRandomSong();
//nếu bật random thì khi ấn next sẽ random
            } else {
                _this.nextSong();
//này là chuyển sang bài tiếp theo
            }
            audio.play();
/*Nếu như bạn muốn ấn next mà bài hát sẽ phát ngay thì dùng cái này, còn nếu
muốn ấn next mà phải ấn nút play mới hát thì chỉ cần xóa câu lệnh này*/
            player.classList.add("playing");
            _this.isPlaying = true;
/*Thêm cái này vào để khi ta reload lại trang ấn next thì nó chuyển icon
và có thể bật tắt được*/
            _this.render();
/*Hàm này gọi lại render giúp cập nhật currentIndex từ đó thêm được class
active để hiển thị màu hồng trên bài hát đang hát
Nếu thiếu hàm render() này thì khi class active chỉ được thêm ở bài đầu
tiên khi mà ta reload thôi. Nên bắt buộc phải thêm nó vào để tạo được màu
hồng khi mà bài hát đang được dùng.*/
            _this.scrollToActiveSong();
//Hàm này dùng để trượt bài hát đang hát trong tầm mắt
        }

//5.Previou song (Xử lý khi ấn prev song)
        prevBtn.onclick = function(){ 
            
            if(_this.isRandom){
                _this.playRandomSong();
//nếu bật random thì khi ấn prev sẽ random
            } else {
                _this.prevSong();
//lùi lại bài phía trước
            }
            audio.play();
/*Nếu như bạn muốn ấn prev mà bài hát sẽ phát ngay thì dùng cái này, còn nếu
muốn ấn prev mà phải ấn nút play mới hát thì chỉ cần xóa câu lệnh này*/
            player.classList.add("playing");
            _this.isPlaying = true;
/*Thêm cái này vào để khi ta reload lại trang ấn next thì nó chuyển icon
và có thể bật tắt được*/
            _this.render();
//Hàm này gọi lại render giúp cập nhật currentIndex từ đó thêm được class
//active để hiển thị màu hồng trên bài hát đang hát
            _this.scrollToActiveSong();

// Nếu thiếu hàm render() này thì khi class active chỉ được thêm ở bài đầu
// tiên khi mà ta reload thôi. Nên bắt buộc phải thêm nó vào
        }

//7.Xử lý next song hoặc repeat khi audio ended
        audio.onended = function(){
            if(_this.isRepeat){
                audio.play();
//khi nhạc hết bài và bật chế độ lặp lại thì nó sẽ hát tiếp, hát tiếp ở đây 
//sẽ vẫn là bài ấy
            } else {
                nextBtn.click();
//khi nhạc hết bài và ko bật chế độ lặp lại thì nó sẽ tự động click vào nút 
// nextBtn để hát tiếp bài tiếp theo..
            }
        }
//6.Random (Xử lý khi ấn vào nút Random nó sẽ hiển thị màu hồng hoặc tắt đi)
        randomBtn.onclick = function(e){
            // if(_this.isRandom) {
            //     randomBtn.classList.remove('active');
            //     _this.isRandom = false;
            // } else {
            //     randomBtn.classList.add('active');
            //     _this.isRandom = true;
            // }
            //Đấy là cách đơn giản

            //Dùng cách này ngắn gọn và hay hơn
            _this.isRandom = !_this.isRandom;
            randomBtn.classList.toggle('active',_this.isRandom);
/*Câu lệnh này sử dụng phương thức classList.toggle() để thêm hoặc xóa một lớp
CSS khỏi phần tử HTML được lựa chọn, dựa trên giá trị của biến _this.isRandom.
Cụ thể, nếu _this.isRandom có giá trị true, thì lớp CSS "active" sẽ được thêm
vào phần tử HTML được lựa chọn (trong trường hợp này là phần tử có lớp CSS 
"randomBtn"). Ngược lại, nếu _this.isRandom có giá trị false, thì lớp CSS 
"active" sẽ được xóa khỏi phần tử HTML. Nếu như ko có _this.isRandom thì
nó vẫn hoạt động được, vì theo toggle thì nếu randomBtn mà có class active
thì nó sẽ gỡ bỏ, còn không có thì nó tự thêm vào.
Điều này có thể giúp thay đổi trạng thái của phần tử HTML (ví dụ: thêm hoặc 
xóa hiệu ứng hoặc trạng thái CSS) dựa trên các giá trị của biến hoặc các sự 
kiện xảy ra trong ứng dụng. */
            _this.setConfig('isRandom',_this.isRandom);
        }
//Xử lý khi ấn lặp lại bài hát
        repeatBtn.onclick = function(){
            _this.isRepeat = !_this.isRepeat;
            repeatBtn.classList.toggle('active', _this.isRepeat);
//7.Dùng để đổi màu icon khi ấn lặp lại bài hát
            _this.setConfig('isRepeat',_this.isRepeat);
        }
//10.Lắng nghe hành vi click vào playList
        playList.onclick = function(e){
            const songNode = e.target.closest('.song:not(.active)');
//console.log(songNode) nên in ra màn hình để xem nó in ra cái gì, từ đó
//lấy cái cần thiết
            //console.log(e.target)
//Khi ta ấn click nào thì nó sẽ trả về đối tượng mà ta click ấy trong playList

/*Điều kiện này có nghĩa là nếu ta ấn vào cái dấu ba chấm bên cạnh bài hát
thì sẽ ko làm gì cả, còn nếu ta ko ấn vào bài khác thì nó thực hiện khối
lệnh bên trong là chuyển bài hát*/
            if(!e.target.closest('.option')){
/*Câu điều kiện này là để kiểm tra nếu như ta click vào bài hát đang hát thì
sẽ ko làm gì, còn nếu ko phải bài hát đang hát thì sẽ chuyển bài... */
                if(songNode){
                   // _this.currentIndex = Number(songNode.dataset.index);
                   _this.currentIndex =Number(songNode.getAttribute("data-index"));
//hàm này có nhiệm vụ là lấy số trong data-index và gán cho currentIndex mà thôi
                   
//console.log(_this.currentIndex);
/*Cẩn thận đoạn này, nếu ta in ra màn hình thì là số nhưng nó đang ở dạng 
chuỗi. Nếu ta dùng câu lệnh dưới này thì sẽ thấy nó là String. Vì nó là 
dạng chuỗi nên khi in ra có màu đen */
//console.log(typeof _this.currentIndex);
//console.log(123); Ta thấy khi in ra nó là màu xanh
/*Đấy là giải thích tại sao chỗ này ta cần dùng hàm number 
_this.currentIndex =Number(songNode.getAttribute("data-index"));.Nếu không 
dùng hàm number thì ấn vào nó vẫn hát tuy nhiên nó ko có thêm class active 
được*/
                    _this.loadCurrentSong();
//Hiển thị thông tin bài hát ấy ra màn hình ở đầu web
                    audio.play();
//Phát nhạc
                    player.classList.add("playing");
                    _this.isPlaying = true;
/*2 hàm trên có nhiệm vụ là khi ta ấn chuyển bài hát thì nó sẽ add thêm class
playing để chuyển icon và chuyển isPlaying sang true để có thể bật tắt nhạc*/
                    _this.render();
//Hàm này dùng để nếu ta click vào bài hát thì nó sẽ thêm class active
                }
            }
        }
    }, 
//9.Scroll active song into view
    scrollToActiveSong: function(){
        setTimeout(()=>{
            $('.song.active').scrollIntoView({
                block: 'center', //center,start, end tùy thích
                inline : 'nearest'
//Hàm này giúp cho ta khi trượt thì nó vẫn trong tầm nhìn của ta
            })
        },300)
    },
//1.Render song (bao gồm lấy ra bài hát đầu tiên trong list)
    loadCurrentSong: function () {
        // Cái này ném ra ngoài cho nó dễ nhìn với lại chỉ định nghĩa 1
        //lần chứ để trong này mỗi lần gọi nó thì nó lại định nghĩa lại
        // const heading = $('header h2');
        // const cdThumb = $('.cd-thumb');
        // const audio = $('#audio');

        heading.textContent = this.currentSong.name;
        // cdThumb.style.backgroundImage = this.currentSong.image;
        cdThumb.style.backgroundImage =`url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;  
         
    },
    loadConfig: function(){
        this.isRandom = this.config.isRandom;
        this.isRepeat = this.config.isRepeat;
    },
    nextSong: function(){
        this.currentIndex++;
        //console.log(this.currentSong.value);
        if(this.currentIndex >= this.songs.length){
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
    },
    prevSong: function(){
        this.currentIndex--;
       // console.log(this.currentSong.value);
        if(this.currentIndex < 0){
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
    },
    playRandomSong: function(){
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.songs.length);
/*Chọn ngẫu nhiêu từ 0 -> đến bài cuối cùng this.songs.length -1 tại vì hàm
random này ko lấy số bên phải, nghĩa là từ 0-10 thì nó ko lấy 10 chỉ lấy
từ 0-9 thôi, thế nên tại sao ta nên dùng bằng this.songs.length thay vì
this.songs.length -1. Bởi vì hàm math.random() chỉ tạo ra được từ [0,1)*/
        } while(newIndex === this.currentIndex);
        
        this.currentIndex = newIndex;
        this.loadCurrentSong();
        
    },
    start: function () {
         
        //Gán cấu hình từ config vào ứng dụng
        this.loadConfig();
        this.defineProperties();
        this.handleEvents();

        //Tải thông tin bài hát đầu tiên khi chạy ứng dụng
        this.loadCurrentSong();

        //hiển thị danh sách bài hát
        this.render();
        
        //Hiển thị trạng thái ban đầu của button random và repeat 
        randomBtn.classList.toggle('active',this.isRandom)
        repeatBtn.classList.toggle('active',this.isRepeat)
    }
}

app.start();
// app.defineProperties()
//console.log(app.currentSong)

/*Chú ý với thuộc tính currentSong, bởi vì ta định nghĩa nó trong hàm 
defineProperties nên nếu muốn dùng biến này thì ta phải gọi đến hàm 
defineProperties này trước đã, thế nên tại sao trong hàm start ta lại đặt 
hàm này thứ 2 bởi vì hàm đầu tiên thì ko cần dùng đến thuộc tính này, các
hàm phía dưới đều dùng đến thuộc tính này nên ta phải đặt nó trước.*/
