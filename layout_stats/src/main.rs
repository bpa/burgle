use std::char;
use std::cmp;
use std::cmp::Ordering::{Equal, Greater, Less};
use std::collections::VecDeque;
use std::fmt;
use std::iter::FromIterator;

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
    print_stats(5, 12, 0);
}

static NORTH: [usize; 4] = [1, 0, 2, 3];
static NE: [usize; 4] = [3, 0, 1, 2];
static EAST: [usize; 4] = [3, 2, 0, 1];
static SE: [usize; 4] = [2, 3, 0, 1];
static SOUTH: [usize; 4] = [1, 3, 2, 0];
static SW: [usize; 4] = [1, 2, 3, 0];
static WEST: [usize; 4] = [0, 1, 3, 2];
static NW: [usize; 4] = [0, 1, 2, 3];

fn print_stats(size: usize, walls: usize, shaft: isize) {
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
        "{},{},{},{},{},{},{},{},{},{}",
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
struct Stat {
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

struct LayoutIter {
    state: Vec<usize>,
    walls: usize,
    bits: usize,
    end: usize,
    last: bool,
    display: usize,
    cmp: usize,
}

impl LayoutIter {
    fn new(size: usize, walls: usize) -> LayoutIter {
        let bits = size * (size - 1) * 2;
        let state = (0..walls).collect();
        // let state = (1..=walls).collect();
        // let state = vec![1, 2, 3, 4, 19, 20, 21, 22, 23, 24, 25, 26];
        let end = if bits - walls == 1 {
            1
        } else {
            (bits - walls) / 2
        };
        // let display = cmp::min(size, walls / 2 + 1);

        LayoutIter {
            state,
            walls,
            bits,
            end,
            last: false,
            display: size,
            cmp: size - 1,
        }
    }
}

impl Iterator for LayoutIter {
    type Item = Layout;

    fn next(&mut self) -> Option<Layout> {
        if self.last {
            None
        } else {
            let layout = Layout(self.state.clone());
            if self.state[0] == self.end {
                self.last = true;
                return Some(layout);
            }

            let mut i = self.state.len() - 1;
            loop {
                let mut offset = self.state[i] + 1;
                self.state[i] = offset;
                if offset > (self.bits - (self.walls - i)) {
                    i = i - 1;
                } else {
                    i += 1;
                    while i < self.walls {
                        offset += 1;
                        self.state[i] = offset;
                        i += 1;
                    }

                    break;
                }
            }

            // println!("{:?}", layout);
            if self.state[self.cmp] != layout.0[self.cmp] {
                println!("{:?}    \r", &layout.0[0..self.display]);
            }
            Some(layout)
        }
    }
}

#[derive(Debug)]
struct Tile {
    n: bool,
    e: bool,
    s: bool,
    w: bool,
    walls: usize,
    heat: usize,
    distance: Vec<usize>,
}

impl Tile {
    fn reset(&mut self) {
        self.n = true;
        self.e = true;
        self.s = true;
        self.w = true;
        self.walls = 0;
        self.heat = 0;
        self.distance
            .iter_mut()
            .for_each(|d| *d = usize::max_value());
    }

    fn add_wall(&mut self) -> Result<(), ()> {
        self.walls += 1;
        if self.walls > 3 {
            Err(())
        } else {
            Ok(())
        }
    }

    fn set_n(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.n {
            self.n = false;
            Ok(())
        } else {
            Err(())
        }
    }

    fn set_e(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.e {
            self.e = false;
            Ok(())
        } else {
            Err(())
        }
    }

    fn set_s(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.s {
            self.s = false;
            Ok(())
        } else {
            Err(())
        }
    }

    fn set_w(&mut self) -> Result<(), ()> {
        self.add_wall()?;
        if self.w {
            self.w = false;
            Ok(())
        } else {
            Err(())
        }
    }
}

#[derive(Debug)]
struct Floor {
    size: usize,
    shaft: isize,
    tiles: Vec<Tile>,
    num_tiles: usize,
    row_size: usize,
}

impl Floor {
    fn new(size: usize, shaft: isize) -> Floor {
        let num_tiles = size * size;
        let mut tiles: Vec<Tile> = Vec::with_capacity(num_tiles);
        for _ in 0..num_tiles {
            tiles.push(Tile {
                n: true,
                e: true,
                s: true,
                w: true,
                walls: 0,
                heat: 0,
                distance: vec![usize::max_value(); num_tiles],
            });
        }
        Floor {
            size,
            shaft,
            tiles,
            num_tiles,
            row_size: size * 2 - 1,
        }
    }

    fn generate_stats(&mut self, layout: Layout) -> Option<Stat> {
        match self.generate_stat(layout) {
            Ok(s) => Some(s),
            Err(_) => None,
        }
    }

    fn generate_stat(&mut self, layout: Layout) -> Result<Stat, ()> {
        self.tiles.iter_mut().for_each(|t| t.reset());
        self.set_shaft();
        self.set_walls(&layout)?;
        self.build_distances();
        if self.is_valid() {
            self.walk_all();
            Ok(self.get_stats(layout))
        } else {
            Err(())
        }
    }

    fn set_walls(&mut self, layout: &Layout) -> Result<(), ()> {
        let width = self.size - 1;
        for wall in &layout.0 {
            let col = wall % self.row_size;
            let y = wall / self.row_size;
            if col < width {
                let i = y * self.size + col;
                self.tiles[i].set_e()?;
                self.tiles[i + 1].set_w()?;
            } else {
                let i = y * self.size + col - width;
                self.tiles[i].set_s()?;
                self.tiles[i + self.size].set_n()?;
            }
        }

        let bottom = self.size * width;
        for i in 0..self.size {
            let j = i * self.size;
            self.tiles[i].n = false;
            self.tiles[j + width].e = false;
            self.tiles[bottom + i].s = false;
            self.tiles[j].w = false;
        }

        Ok(())
    }

    fn set_shaft(&mut self) {
        if self.shaft >= 0 && (self.shaft as usize) < self.tiles.len() {
            let shaft = self.shaft as usize;
            let t = &mut self.tiles[shaft];
            t.n = false;
            t.e = false;
            t.s = false;
            t.w = false;

            let x = shaft % self.size;
            let y = shaft / self.size;
            if x > 0 {
                self.tiles[shaft - 1].e = false;
            }
            if x < self.size - 1 {
                self.tiles[shaft + 1].w = false;
            }
            if y > 0 {
                self.tiles[shaft - self.size].s = false;
            }
            if y < self.size - 1 {
                self.tiles[shaft + self.size].n = false;
            }
        }
    }

    fn build_distances(&mut self) {
        let mut queue: VecDeque<usize> = VecDeque::with_capacity(self.num_tiles);
        let size = self.size;
        for t in 0..self.num_tiles {
            self.tiles[t].distance[t] = 0;
            queue.push_back(t);
            while !queue.is_empty() {
                let i = queue.pop_front().unwrap();
                let dist = self.tiles[i].distance[t] + 1;

                self.update(|t| t.n, dist, i, t, &mut queue, i.wrapping_sub(size));
                self.update(|t| t.e, dist, i, t, &mut queue, i + 1);
                self.update(|t| t.s, dist, i, t, &mut queue, i + size);
                self.update(|t| t.w, dist, i, t, &mut queue, i.wrapping_sub(1));
            }
        }
    }

    fn update<F>(
        &mut self,
        open: F,
        dist: usize,
        i: usize,
        t: usize,
        queue: &mut VecDeque<usize>,
        j: usize,
    ) where
        F: FnOnce(&Tile) -> bool,
    {
        let tile = &self.tiles[i];
        if open(tile) {
            let other = &mut self.tiles[j];
            if other.distance[t] > dist {
                other.distance[t] = dist;
                queue.push_back(j);
            }
        }
    }

    fn is_valid(&self) -> bool {
        let t = if self.shaft == 0 { 1 } else { 0 };
        for (i, d) in self.tiles[t].distance.iter().enumerate() {
            if i as isize == self.shaft {
                continue;
            }
            if *d == usize::max_value() {
                return false;
            }
        }
        true
    }

    fn walk_all(&mut self) {
        for end in 0..self.num_tiles {
            if end as isize == self.shaft {
                continue;
            }
            let x = end % self.size;
            let y = end / self.size;
            for start in 0..self.num_tiles {
                if start == end || start as isize == self.shaft {
                    continue;
                }
                let mut i = start;
                self.tiles[i].heat += 1;
                while i != end {
                    let q = self.quadrant(i, x, y);
                    i = self.step_toward(i, end, q);
                    self.tiles[i].heat += 1;
                }
            }
        }
    }

    fn get_stats(&self, layout: Layout) -> Stat {
        let mut min = usize::max_value();
        let mut max = 0;
        let mut total = 0;
        for tile in &self.tiles {
            if tile.walls == 4 {
                continue;
            }
            min = cmp::min(min, tile.heat);
            max = cmp::max(max, tile.heat);
            total += tile.heat;
        }
        Stat {
            min,
            max,
            total,
            layout,
        }
    }

    fn step_toward(&mut self, ind: usize, goal: usize, q: &[usize; 4]) -> usize {
        let tile = &self.tiles[ind];
        let mut next = 0;
        let mut min = usize::max_value();
        let mut min_dir = 0;

        let mut step = |open, dir, j| {
            if open {
                let neighbor: &Tile = &self.tiles[j];
                if neighbor.distance[goal] < min
                    || (neighbor.distance[goal] == min && q[dir] > q[min_dir])
                {
                    next = j;
                    min = neighbor.distance[goal];
                    min_dir = dir;
                }
            }
        };

        step(tile.n, 0, ind.wrapping_sub(self.size));
        step(tile.e, 1, ind + 1);
        step(tile.s, 2, ind + self.size);
        step(tile.w, 3, ind.wrapping_sub(1));
        next
    }

    fn quadrant(&self, start: usize, x: usize, y: usize) -> &'static [usize; 4] {
        let sx = start % self.size;
        let sy = start / self.size;

        match (x.partial_cmp(&sx), y.partial_cmp(&sy)) {
            (Some(Equal), Some(Less)) => &NORTH,
            (Some(Greater), Some(Less)) => &NE,
            (Some(Greater), Some(Equal)) => &EAST,
            (Some(Greater), Some(Greater)) => &SE,
            (Some(Equal), Some(Greater)) => &SOUTH,
            (Some(Less), Some(Greater)) => &SW,
            (Some(Less), Some(Equal)) => &WEST,
            (Some(Less), Some(Less)) => &NW,
            (_, _) => &NORTH,
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
struct Layout(Vec<usize>);

impl fmt::Display for Layout {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut code: Vec<char> = Vec::new();
        let mut val: u64 = self.0.iter().map(|i| (1 as u64) << i).sum();

        while val > 0 {
            let num = val & 0b11111;
            code.push(char::from_digit(num as u32, 32).unwrap());
            val >>= 5;
        }

        code.reverse();
        write!(f, "{}", String::from_iter(code))
    }
}

#[derive(Debug)]
struct Url {
    size: usize,
    shaft: isize,
    f0: Layout,
    f1: Layout,
}

impl Url {
    fn new(size: usize, shaft: isize, f0: Layout, f1: Layout) -> Url {
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
            self.shaft,
            self.f0,
            self.f1
        )
    }
}

#[cfg(test)]
#[allow(dead_code)]
mod tests {
    use crate::*;
    use std::io::Write;
    use std::str;

    impl Layout {
        fn of(val: u64, walls: usize) -> Layout {
            let mut val = val;
            let mut vec = Vec::with_capacity(walls);
            let mut i = 0;
            while val > 0 {
                if val & 1 > 0 {
                    vec.push(i);
                }
                i += 1;
                val >>= 1;
            }
            Layout(vec)
        }
    }

    fn check_format(bits: u64, walls: usize, exp: &'static [u8]) {
        let mut d = Vec::new();
        write!(&mut d, "{}", Layout::of(bits, walls)).unwrap();
        assert_eq!(
            d,
            exp,
            "{:b}> {} != {}",
            bits,
            str::from_utf8(&d).unwrap(),
            str::from_utf8(exp).unwrap()
        );
    }

    #[test]
    fn test_layout() {
        check_format(0b000001, 1, b"1");
        check_format(0b000010, 1, b"2");
        check_format(0b010000, 1, b"g");
        check_format(0b111111, 6, b"1v");
        check_format(0b100000, 1, b"10");
        check_format(0b101000, 2, b"18");
    }

    #[test]
    fn test_layout_iter_2_1() {
        let mut it = LayoutIter::new(2, 1);
        assert_eq!(Some(Layout::of(0b0001, 1)), it.next());
        assert_eq!(Some(Layout::of(0b0010, 1)), it.next());
        assert_eq!(None, it.next());
    }

    #[test]
    fn test_layout_iter_2_2() {
        let mut it = LayoutIter::new(2, 2);
        assert_eq!(Some(Layout::of(0b0011, 2)), it.next());
        assert_eq!(Some(Layout::of(0b0101, 2)), it.next());
        assert_eq!(Some(Layout::of(0b1001, 2)), it.next());
        assert_eq!(Some(Layout::of(0b0110, 2)), it.next());
        assert_eq!(None, it.next());
    }

    #[test]
    fn test_layout_iter_2_3() {
        let mut it = LayoutIter::new(2, 3);
        assert_eq!(Some(Layout::of(0b0111, 3)), it.next());
        assert_eq!(Some(Layout::of(0b1011, 3)), it.next());
        assert_eq!(Some(Layout::of(0b1101, 3)), it.next());
        assert_eq!(Some(Layout::of(0b1110, 3)), it.next());
        assert_eq!(None, it.next());
    }

    #[test]
    fn test_layout_iter_2_4() {
        let mut it = LayoutIter::new(2, 4);
        assert_eq!(Some(Layout::of(0b1111, 4)), it.next());
        assert_eq!(None, it.next());
    }

    fn skip(it: &mut LayoutIter, num: usize) {
        for _ in 0..num {
            it.next();
        }
    }

    #[test]
    fn test_layout_iter_3_6() {
        let mut it = LayoutIter::new(3, 6);
        assert_eq!(Some(Layout::of(0b000000111111, 6)), it.next());
        skip(&mut it, 6);
        assert_eq!(Some(Layout::of(0b000001101111, 6)), it.next());
    }

    #[test]
    fn test_step_2x2() {
        let mut floor = Floor::new(2, -1);
        floor.set_walls(&Layout(vec![]));
        floor.build_distances();
        assert_eq!(1, floor.step_toward(0, 3, &SE));
        assert_eq!(3, floor.step_toward(1, 2, &SW));
        assert_eq!(0, floor.step_toward(2, 1, &NE));
        assert_eq!(2, floor.step_toward(3, 0, &NW));
    }

    #[test]
    fn test_step_3x3_ew() {
        let mut floor = Floor::new(3, -1);
        floor.set_walls(&Layout(vec![5]));
        floor.build_distances();
        assert_eq!(0, floor.step_toward(3, 4, &EAST));
        assert_eq!(7, floor.step_toward(4, 3, &WEST));
    }

    #[test]
    fn test_step_3x3_ns() {
        let mut floor = Floor::new(3, -1);
        floor.set_walls(&Layout(vec![3]));
        floor.build_distances();
        assert_eq!(2, floor.step_toward(1, 4, &SOUTH));
        assert_eq!(3, floor.step_toward(4, 1, &NORTH));
    }

    #[test]
    fn test_step_5x5_backwards_corners() {
        let mut floor = Floor::new(5, -1);
        floor.set_walls(&Layout(vec![5, 7, 9, 12, 27, 30, 32, 34]));
        floor.build_distances();
        assert_eq!(11, floor.step_toward(6, 0, &NW));
        assert_eq!(7, floor.step_toward(8, 4, &NE));
        assert_eq!(17, floor.step_toward(16, 20, &SW));
        assert_eq!(13, floor.step_toward(18, 24, &SE));
    }

    #[test]
    fn test_quadrant() {
        let mut floor = Floor::new(3, -1);
        floor.set_walls(&Layout(vec![]));
        floor.build_distances();
        assert_eq!(&NW, floor.quadrant(4, 0, 0));
        assert_eq!(&NORTH, floor.quadrant(4, 1, 0));
        assert_eq!(&NE, floor.quadrant(4, 2, 0));
        assert_eq!(&WEST, floor.quadrant(4, 0, 1));
        assert_eq!(&EAST, floor.quadrant(4, 2, 1));
        assert_eq!(&SW, floor.quadrant(4, 0, 2));
        assert_eq!(&SOUTH, floor.quadrant(4, 1, 2));
        assert_eq!(&SE, floor.quadrant(4, 2, 2));
    }

    #[test]
    fn test_generate_2x2() {
        let mut floor = Floor::new(2, 0);
        match floor.generate_stat(Layout(vec![])) {
            Ok(s) => println!("{:?} {:?}", floor, s),
            Err(_) => assert!(false, "?"),
        }
    }
}
