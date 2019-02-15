use crate::Stat;
use crate::tile::Tile;
use crate::layout::Layout;

use std::cmp;
use std::cmp::Ordering::{Equal, Greater, Less};
use std::collections::VecDeque;

static NORTH: [usize; 4] = [1, 0, 2, 3];
static NE: [usize; 4] = [3, 0, 1, 2];
static EAST: [usize; 4] = [3, 2, 0, 1];
static SE: [usize; 4] = [2, 3, 0, 1];
static SOUTH: [usize; 4] = [1, 3, 2, 0];
static SW: [usize; 4] = [1, 2, 3, 0];
static WEST: [usize; 4] = [0, 1, 3, 2];
static NW: [usize; 4] = [0, 1, 2, 3];

#[derive(Debug)]
pub struct Floor {
    size: usize,
    shaft: Option<usize>,
    tiles: Vec<Tile>,
    num_tiles: usize,
    row_size: usize,
}

impl Floor {
    pub fn new(size: usize, shaft: Option<usize>) -> Floor {
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

    pub fn generate_stats(&mut self, layout: Layout) -> Option<Stat> {
        match self.generate_stat(layout) {
            Ok(s) => Some(s),
            Err(_) => None,
        }
    }

    pub fn generate_stat(&mut self, layout: Layout) -> Result<Stat, ()> {
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

    pub fn set_walls(&mut self, layout: &Layout) -> Result<(), ()> {
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

    pub fn set_shaft(&mut self) {
        if let Some(shaft) = self.shaft {
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

    pub fn build_distances(&mut self) {
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
        let t = match self.shaft {
            Some(i) => if i == 0 { 1 } else { 0 },
            None => 0,
        };

        let mut iter = self.tiles[t].distance.iter();
        match self.shaft {
            Some(s) => iter.enumerate().all(|(i, d)| i == s || *d != usize::max_value()),
            None => iter.all(|d| *d != usize::max_value()),
        }
    }

    fn walk_all(&mut self) {
        let shaft = match self.shaft {
            Some(s) => s,
            None => self.num_tiles,
        };

        for end in 0..self.num_tiles {
            if end == shaft {
                continue;
            }
            let x = end % self.size;
            let y = end / self.size;
            for start in 0..self.num_tiles {
                if start == end || start == shaft {
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

#[cfg(test)]
#[allow(dead_code)]
mod tests {
    use crate::layout::*;
    use crate::floor::*;

    #[test]
    fn test_step_2x2() {
        let mut floor = Floor::new(2, None);
        floor.set_walls(&Layout(vec![]));
        floor.build_distances();
        assert_eq!(1, floor.step_toward(0, 3, &SE));
        assert_eq!(3, floor.step_toward(1, 2, &SW));
        assert_eq!(0, floor.step_toward(2, 1, &NE));
        assert_eq!(2, floor.step_toward(3, 0, &NW));
    }

    #[test]
    fn test_step_3x3_ew() {
        let mut floor = Floor::new(3, None);
        floor.set_walls(&Layout(vec![5]));
        floor.build_distances();
        assert_eq!(0, floor.step_toward(3, 4, &EAST));
        assert_eq!(7, floor.step_toward(4, 3, &WEST));
    }

    #[test]
    fn test_step_3x3_ns() {
        let mut floor = Floor::new(3, None);
        floor.set_walls(&Layout(vec![3]));
        floor.build_distances();
        assert_eq!(2, floor.step_toward(1, 4, &SOUTH));
        assert_eq!(3, floor.step_toward(4, 1, &NORTH));
    }

    #[test]
    fn test_step_5x5_backwards_corners() {
        let mut floor = Floor::new(5, None);
        floor.set_walls(&Layout(vec![5, 7, 9, 12, 27, 30, 32, 34]));
        floor.build_distances();
        assert_eq!(11, floor.step_toward(6, 0, &NW));
        assert_eq!(7, floor.step_toward(8, 4, &NE));
        assert_eq!(17, floor.step_toward(16, 20, &SW));
        assert_eq!(13, floor.step_toward(18, 24, &SE));
    }

    #[test]
    fn test_quadrant() {
        let mut floor = Floor::new(3, None);
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
        let mut floor = Floor::new(2, Some(0));
        match floor.generate_stat(Layout(vec![])) {
            Ok(s) => println!("{:?} {:?}", floor, s),
            Err(_) => assert!(false, "?"),
        }
    }
}