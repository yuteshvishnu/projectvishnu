var count=document.querySelectorAll(".btn-block").length;

for(var i=0;i<count;i++){
document.querySelectorAll(".btn-block")[i].addEventListener('click',function (x){
  this.innerHTML="Added to cart";
  this.disabled=true;
  this.style.color="green";
});
}
