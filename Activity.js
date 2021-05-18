const Store = require('electron-store');
const store = new Store();
const _ = require('underscore')

module.exports = class Activity {
    save(activity)
    {    
      if (typeof this.getLastActivity() == 'undefined' || this.getLastActivity().title != activity.title) {
			activity.time = new Date()
			var activites = [...(store.get("activities") || []), activity]
			store.set('activities', activites);
			return true
      }
      return false
    }

    getLastActivity()
    {        
        return _.last(store.get("activities"))
    }

    all()
    {
        return store.get("activities");
    }

    byDay(day)
    {
      var activites = store.get("activities")
      var filteredActivites =[]

      for (var i = 0; i < activites.length; i++) {
		var activityTime = new Date(activites[i].time).toISOString().slice(0,10);
        
        if (activityTime == day) {			
			filteredActivites.push(activites[i])
        }
      }
      
      return filteredActivites;
    }

	getEvents()
	{
		var activites = this.all();
		var events = []
		for (var i = 0; i < activites.length; i++) {
			if (activites[i + 1]) {				
				var thisDate = new Date(activites[i].time).toISOString().slice(0,10)
				var nextDate = new Date(activites[i + 1].time).toISOString().slice(0,10)
				var found = events.find(({ start }) => start === thisDate)
				
				if (thisDate == nextDate) {
					var nextTime = new Date(activites[i + 1].time)
				} else {        
					var nextTime = new Date(thisDate)
					nextTime.setHours(23)
					nextTime.setMinutes(59)
          nextTime.setSeconds(59)        
				}

				if (found) {				
					var time = this.diff_minutes(new Date(activites[i].time), nextTime)
					found.time += time;
					var hours = Math.floor(found.time / 60);          
        			var minutes = found.time % 60;
					found.title = hours + " Hrs "  + minutes + " Min recorded"
				} else {
					var time = this.diff_minutes(new Date(activites[i].time), nextTime)
					var hours = Math.floor(time / 60)
					var minutes = time % 60;
					
					events.push({
						title:  hours + " Hrs "  + minutes + " Min recorded", 
						start: thisDate,
						end: thisDate,
						allDay: true,
						url: "day.html?date=" + thisDate,
						time: time
					})
				}
			}
		}
		return events
	}

    formatActivities(activites)
    {
        var breakdown = []
        for (var i = 0; i < activites.length; i++) {                   
            if (activites[i + 1]) {
              var found = breakdown.find(({ title }) => title === activites[i].owner.name)
    
              if (found) {                
                var time = this.diff_minutes(new Date(activites[i].time), new Date(activites[i + 1].time))

                found.time += time
                var subActivityFound = found.subActivity.find(({ title }) => title === activites[i].title)
                
                if (subActivityFound) {
                  subActivityFound.time += time
                } else {
                  found.subActivity.push({title: activites[i].title, time: time})
                }

              } else {                
                var time = this.diff_minutes(new Date(activites[i].time), new Date(activites[i + 1].time))
                var subActivity = {title: activites[i].title, time: time}

                breakdown.push(
                  {
                    title: activites[i].owner.name, 
                    time: time,
                    subActivity: [subActivity]
                  }
                )
              }
            }
          }

          for (var i = 0; i < breakdown.length; i++) {
            breakdown[i].subActivity = _.sortBy(breakdown[i].subActivity, 'time').reverse();
          }
          
          return breakdown = _.sortBy(breakdown, 'time').reverse();
    }

	diff_minutes(dt2, dt1)
	{
		var diff =(dt2.getTime() - dt1.getTime()) / 1000;
		diff /= 60;

		return Math.abs(Math.round(diff));
	}

}