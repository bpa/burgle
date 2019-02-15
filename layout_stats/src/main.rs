mod layout;
mod floor;
mod tile;

use std::fmt;
use layout::{Layout,LayoutIter};
use floor::Floor;

fn main() {
    println!("Size,Walls,Shaft,Layouts,Min,Max,Shortest,Longest,Tile Href,Floor Href");
    // print_stats(2, 1, -1);
    // for e in vec![0, 1, 5] {
    //     print_stats(4, 6, e);
    // }
    // print_stats(4, 8, -1);
    // for e in vec![0, 1, 2, 6, 7, 12] {
    //     print_stats(5, 12, e);
    // }
    print_stats(5, 12, Some(0));
}

fn print_stats(size: usize, walls: usize, shaft: Option<usize>) {
    let mut f_min = Data::new(usize::max_value());
    let mut f_max = Data::new(0);
    let mut t_min = Data::new(usize::max_value());
    let mut t_max = Data::new(0);
    let mut layouts = 0;
    let mut floor = Floor::new(size, shaft);

    LayoutIter::new(size, walls)
        .filter_map(|layout| floor.generate_stats(layout))
        .for_each(|stat| {
            layouts += 1;
            f_min.min(stat.min, &stat.layout);
            f_max.max(stat.max, &stat.layout);
            t_min.min(stat.total, &stat.layout);
            t_max.max(stat.total, &stat.layout);
        });

    println!(
        "{},{},{:?},{},{},{},{},{},{},{}",
        size,
        walls,
        shaft,
        layouts,
        f_min.value,
        f_max.value,
        t_min.value,
        t_max.value,
        Url::new(size, shaft, f_min.layout, f_max.layout),
        Url::new(size, shaft, t_min.layout, t_max.layout)
    );
}

#[derive(Debug)]
pub struct Stat {
    min: usize,
    max: usize,
    total: usize,
    layout: Layout,
}

struct Data {
    value: usize,
    layout: Layout,
}

impl Data {
    fn new(value: usize) -> Data {
        Data {
            value,
            layout: Layout(Vec::with_capacity(0)),
        }
    }

    fn min(&mut self, value: usize, layout: &Layout) {
        if value < self.value {
            self.value = value;
            self.layout = layout.clone();
        }
    }

    fn max(&mut self, value: usize, layout: &Layout) {
        if value > self.value {
            self.value = value;
            self.layout = layout.clone();
        }
    }
}


#[derive(Debug)]
struct Url {
    size: usize,
    shaft: Option<usize>,
    f0: Layout,
    f1: Layout,
}

impl Url {
    fn new(size: usize, shaft: Option<usize>, f0: Layout, f1: Layout) -> Url {
        Url {
            size,
            shaft,
            f0,
            f1,
        }
    }
}

impl fmt::Display for Url {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "http://gabob.com/burgle/?job={}&s={}&f0={}&f1={}",
            if self.size == 4 { 1 } else { 2 },
            if self.shaft.is_some() { self.shaft.unwrap() as isize } else { -1 },
            self.f0,
            self.f1
        )
    }
}
