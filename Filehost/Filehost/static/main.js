new Vue({
  el: "#files",
  data: {
    sortKey: 'Datum',
    reverse: false,
    search:'',
    columns: ['id', 'name', 'Datum', 'Teilen mit'],
    newFile:{},
    tableData[
      {id: 1, name: Mix1, Datum: 1.12.2017, Teilen mit: Niemanden},
      {id: 2, name: Mix2, Datum: 2.12.2017, Teilen mit: Schredi,
      {id: 3, name: Mix3, Datum: 3.12.2017, Teilen mit: Alex},
      {id: 4, name: Mix4, Datum: 4.12.2017, Teilen mit: Niemanden},
      {id: 5, name: Mix5, Datum: 11.12.2017, Teilen mit: Niemanden},
    ]
  },
  methods:{
    sortBy:
    function(sortKey){
      this.reverse = (this.sortKey == sortKey) ?! this.reverse : false;

      this.sortKey = sortKey;
    },
    addFile: function(){
      this.file.push(this.newFile);
      this.newFile={};
    }
  }
});
