import math
import unittest
from unittest.mock import patch
import build_profile as p
class Calculations(unittest.TestCase):
    def test_acs_suppressed_and_missing(self):
        for v in [None, '-666666666', 'null', 'NaN', True]: self.assertIsNone(p.number(v))
        self.assertEqual(p.number('0'),0)
    def test_ratio_and_uncertainty(self):
        value,moe=p.ratio(20,100,2,5)
        self.assertEqual(value,20)
        self.assertAlmostEqual(moe,math.sqrt(5))
        self.assertEqual(p.ratio(0,0,0,0),(None,None))
        self.assertEqual(p.ratio(20,100,None,5),(20,None))
    def test_boundary_validation_prevents_query_injection(self):
        with self.assertRaises(ValueError):p.boundary("21111' OR 1=1")
    def test_mirror_release_must_match(self):
        with patch.dict(p.os.environ,{},clear=True),patch.object(p,'public_get',return_value={'release':{'id':'acs2023_5yr'}}):
            with self.assertRaisesRegex(ValueError,'release mismatch'):p.acs_records('21111',{})
    def test_reciprocal_edges_not_double_counted(self):
        import networkx as nx
        import osmnx as ox
        graph=nx.MultiDiGraph(crs='EPSG:4326')
        graph.add_node(1,x=0,y=0);graph.add_node(2,x=.001,y=0)
        graph.add_edge(1,2,length=100,osmid=1);graph.add_edge(2,1,length=100,osmid=1)
        self.assertEqual(sum(d['length'] for _,_,d in ox.convert.to_undirected(graph).edges(data=True)),100)
    def test_missing_sidewalk_on_one_subsegment_is_not_full_coverage(self):
        import networkx as nx
        import osmnx as ox
        graph=nx.MultiDiGraph(crs='EPSG:4326')
        for i in range(3):graph.add_node(i,x=i*.001,y=0)
        for a,b,tag in [(0,1,1),(1,2,0)]:
            for u,v in [(a,b),(b,a)]:graph.add_edge(u,v,osmid=10,length=100,pair_sidewalk_documented=tag)
        simple=ox.simplification.simplify_graph(graph,edge_attr_aggs={'length':sum,'pair_sidewalk_documented':min})
        self.assertTrue(all(d['pair_sidewalk_documented']==0 for _,_,d in simple.edges(data=True)))
if __name__=='__main__':unittest.main()
